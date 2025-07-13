const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

// Canvas環境の設定
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class PersonImageProcessor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            inputDir: config.inputDir || './data/seated_photos',
            outputDir: config.outputDir || './data/processed',
            modelsDir: config.modelsDir || './models',
            targetWidth: config.targetWidth || 800,
            targetHeight: config.targetHeight || 1200,
            headTopMargin: config.headTopMargin || 50,
            ...config
        };
        
        this.isModelLoaded = false;
        this.processingQueue = [];
        this.results = new Map();
    }
    
    async init() {
        try {
            console.log('🧠 AI models を初期化中...');
            
            // Face-APIモデルの読み込み
            await this.loadFaceModels();
            
            // ディレクトリの作成
            await this.ensureDirectories();
            
            console.log('✅ PersonImageProcessor が初期化されました');
            this.isModelLoaded = true;
            
            return true;
        } catch (error) {
            console.error('❌ 初期化エラー:', error);
            return false;
        }
    }
    
    async loadFaceModels() {
        try {
            const modelPath = this.config.modelsDir;
            
            // 必要なモデルファイルをダウンロード（初回のみ）
            await this.downloadModelsIfNeeded();
            
            // Face-APIモデルの読み込み
            await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
            await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
            await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
            
            console.log('✅ Face-API models loaded');
        } catch (error) {
            console.error('❌ Face model loading error:', error);
            // フォールバック: モデルなしで動作
            console.log('⚠️ Face detection will be disabled');
        }
    }
    
    async downloadModelsIfNeeded() {
        const modelFiles = [
            'tiny_face_detector_model-weights_manifest.json',
            'tiny_face_detector_model-shard1',
            'face_landmark_68_model-weights_manifest.json',
            'face_landmark_68_model-shard1',
            'face_recognition_model-weights_manifest.json',
            'face_recognition_model-shard1'
        ];
        
        const modelPath = this.config.modelsDir;
        
        // modelsディレクトリが存在しない場合は作成
        try {
            await fs.access(modelPath);
        } catch {
            await fs.mkdir(modelPath, { recursive: true });
        }
        
        // モデルファイルの存在確認
        const missingFiles = [];
        for (const file of modelFiles) {
            try {
                await fs.access(path.join(modelPath, file));
            } catch {
                missingFiles.push(file);
            }
        }
        
        if (missingFiles.length > 0) {
            console.log('📥 Face-APIモデルファイルをダウンロード中...');
            console.log('⚠️ 実際の実装では、モデルファイルを手動でmodelsフォルダに配置してください');
            // 実際の実装では、ここでモデルファイルをダウンロードする処理を行います
        }
    }
    
    async ensureDirectories() {
        const dirs = [
            this.config.inputDir,
            this.config.outputDir,
            this.config.modelsDir
        ];
        
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
            }
        }
    }
    
    async processAllImages() {
        console.log('🚀 画像処理を開始します...');
        
        if (!this.isModelLoaded) {
            console.log('⏳ モデルの初期化を待機中...');
            await this.init();
        }
        
        try {
            const files = await fs.readdir(this.config.inputDir);
            const imageFiles = files.filter(file => 
                /\.(jpg|jpeg|png|bmp)$/i.test(file)
            );
            
            console.log(`📸 ${imageFiles.length} 枚の画像を発見しました`);
            
            let processed = 0;
            const results = [];
            
            for (const file of imageFiles) {
                try {
                    console.log(`\n🔄 処理中: ${file}`);
                    const result = await this.processImage(file);
                    results.push(result);
                    processed++;
                    
                    this.emit('imageProcessed', {
                        file,
                        result,
                        progress: processed / imageFiles.length
                    });
                    
                } catch (error) {
                    console.error(`❌ ${file} の処理でエラー:`, error.message);
                    results.push({
                        filename: file,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            console.log(`\n🎉 処理完了: ${processed}/${imageFiles.length} 枚`);
            return results;
            
        } catch (error) {
            console.error('❌ 画像処理エラー:', error);
            throw error;
        }
    }
    
    async processImage(filename) {
        const inputPath = path.join(this.config.inputDir, filename);
        const baseName = path.parse(filename).name;
        const outputPath = path.join(this.config.outputDir, `${baseName}_processed.jpg`);
        
        console.log(`  📥 画像を読み込み中: ${filename}`);
        
        // Sharp で画像を読み込み
        const image = sharp(inputPath);
        const metadata = await image.metadata();
        
        console.log(`  📐 元画像サイズ: ${metadata.width}x${metadata.height}`);
        
        // 画像をBufferとして取得（Face-API用）
        const imageBuffer = await image.png().toBuffer();
        
        let faceBox = null;
        let landmarks = null;
        
        // 顔検出の実行
        try {
            console.log('  🔍 顔検出を実行中...');
            const detectionResult = await this.detectFace(imageBuffer);
            if (detectionResult) {
                faceBox = detectionResult.box;
                landmarks = detectionResult.landmarks;
                console.log(`  ✅ 顔を検出: x=${faceBox.x}, y=${faceBox.y}, w=${faceBox.width}, h=${faceBox.height}`);
            } else {
                console.log('  ⚠️ 顔が検出されませんでした');
            }
        } catch (error) {
            console.log('  ⚠️ 顔検出をスキップ:', error.message);
        }
        
        // OCR（文字認識）の実行
        let ocrResult = null;
        try {
            console.log('  📝 文字認識を実行中...');
            ocrResult = await this.performOCR(imageBuffer);
            console.log(`  ✅ 認識された文字: ${ocrResult.numbers || 'なし'}, ${ocrResult.name || 'なし'}`);
        } catch (error) {
            console.log('  ⚠️ 文字認識をスキップ:', error.message);
        }
        
        // 画像の切り取りと加工
        console.log('  ✂️ 画像を加工中...');
        const processedImage = await this.cropAndResize(image, metadata, faceBox);
        
        // 結果を保存
        await processedImage.jpeg({ quality: 90 }).toFile(outputPath);
        
        const result = {
            filename,
            outputPath,
            success: true,
            originalSize: { width: metadata.width, height: metadata.height },
            processedSize: { width: this.config.targetWidth, height: this.config.targetHeight },
            faceDetected: !!faceBox,
            faceBox,
            landmarks,
            ocr: ocrResult,
            timestamp: new Date()
        };
        
        // 結果をJSONとして保存
        const resultPath = path.join(this.config.outputDir, `${baseName}_result.json`);
        await fs.writeFile(resultPath, JSON.stringify(result, null, 2));
        
        console.log(`  ✅ 処理完了: ${outputPath}`);
        return result;
    }
    
    async detectFace(imageBuffer) {
        try {
            // Canvas要素を作成
            const img = new Image();
            
            return new Promise((resolve, reject) => {
                img.onload = async () => {
                    try {
                        const detections = await faceapi
                            .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
                            .withFaceLandmarks();
                        
                        if (detections && detections.length > 0) {
                            // 最大の顔を選択
                            const detection = detections.reduce((prev, current) => 
                                (prev.detection.box.width * prev.detection.box.height) > 
                                (current.detection.box.width * current.detection.box.height) ? prev : current
                            );
                            
                            resolve({
                                box: detection.detection.box,
                                landmarks: detection.landmarks
                            });
                        } else {
                            resolve(null);
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = reject;
                img.src = imageBuffer;
            });
        } catch (error) {
            console.error('Face detection error:', error);
            return null;
        }
    }
    
    async performOCR(imageBuffer) {
        try {
            const worker = await Tesseract.createWorker('jpn+eng');
            
            const { data: { text } } = await worker.recognize(imageBuffer);
            await worker.terminate();
            
            // 4桁の数字を抽出
            const numberMatch = text.match(/\d{4}/);
            const numbers = numberMatch ? numberMatch[0] : null;
            
            // 日本語の文字（氏名）を抽出（簡易版）
            const japaneseMatch = text.match(/[ひらがなカタカナ漢字]+/);
            const name = japaneseMatch ? japaneseMatch[0] : null;
            
            return {
                rawText: text.trim(),
                numbers,
                name,
                confidence: 0.8 // 実際はOCRの信頼度を使用
            };
        } catch (error) {
            console.error('OCR error:', error);
            return null;
        }
    }
    
    async cropAndResize(image, metadata, faceBox) {
        let cropParams = {
            left: 0,
            top: 0,
            width: metadata.width,
            height: metadata.height
        };
        
        if (faceBox) {
            // 顔を中心とした切り取り範囲を計算
            const faceCenterX = faceBox.x + faceBox.width / 2;
            const faceCenterY = faceBox.y + faceBox.height / 2;
            
            // 頭のてっぺんより50px上から開始
            const topY = Math.max(0, faceBox.y - this.config.headTopMargin);
            
            // 縦長の比率を維持して切り取り範囲を計算
            const aspectRatio = this.config.targetWidth / this.config.targetHeight;
            let cropWidth = metadata.height * aspectRatio;
            let cropHeight = metadata.height;
            
            // 幅が画像をはみ出す場合は調整
            if (cropWidth > metadata.width) {
                cropWidth = metadata.width;
                cropHeight = metadata.width / aspectRatio;
            }
            
            // 顔を中心にして切り取り位置を調整
            let cropLeft = faceCenterX - cropWidth / 2;
            cropLeft = Math.max(0, Math.min(cropLeft, metadata.width - cropWidth));
            
            // 上端を調整（頭より50px上から）
            let cropTop = topY;
            cropTop = Math.max(0, Math.min(cropTop, metadata.height - cropHeight));
            
            cropParams = {
                left: Math.round(cropLeft),
                top: Math.round(cropTop),
                width: Math.round(cropWidth),
                height: Math.round(cropHeight)
            };
            
            console.log(`  📏 切り取り範囲: x=${cropParams.left}, y=${cropParams.top}, w=${cropParams.width}, h=${cropParams.height}`);
        }
        
        // 画像を切り取って、指定サイズにリサイズ
        return image
            .extract(cropParams)
            .resize(this.config.targetWidth, this.config.targetHeight, {
                fit: 'cover',
                position: 'center'
            });
    }
    
    async getProcessingStatus() {
        return {
            isModelLoaded: this.isModelLoaded,
            queueLength: this.processingQueue.length,
            resultsCount: this.results.size,
            config: this.config
        };
    }
}

module.exports = PersonImageProcessor;
