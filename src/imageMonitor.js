const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const chokidar = require('chokidar');
const EventEmitter = require('events');

class ImageMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            originalDir: config.originalDir || './data/original',
            targetDir: config.targetDir || './data/target',
            outputDir: config.outputDir || './output',
            watchInterval: config.watchInterval || 1000,
            ...config
        };
        
        this.originalImages = new Map();
        this.targetImages = new Map();
        this.results = new Map();
        
        this.init();
    }
    
    async init() {
        // ディレクトリの作成
        await this.ensureDirectories();
        
        // 初期画像の読み込み
        await this.loadInitialImages();
        
        // ファイル監視の開始
        this.startWatching();
        
        console.log('🎯 Image Monitor initialized');
        console.log(`📁 Watching: ${this.config.originalDir}, ${this.config.targetDir}`);
    }
    
    async ensureDirectories() {
        const dirs = [
            this.config.originalDir,
            this.config.targetDir,
            this.config.outputDir
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }
    
    async loadInitialImages() {
        await this.loadImagesFromDirectory(this.config.originalDir, this.originalImages, 'original');
        await this.loadImagesFromDirectory(this.config.targetDir, this.targetImages, 'target');
        
        this.compareImages();
    }
    
    async loadImagesFromDirectory(directory, imageMap, type) {
        if (!fs.existsSync(directory)) return;
        
        const files = fs.readdirSync(directory);
        const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png|bmp|gif)$/i.test(file)
        );
        
        for (const file of imageFiles) {
            const filePath = path.join(directory, file);
            try {
                const image = await Jimp.read(filePath);
                const key = path.parse(file).name; // ファイル名から拡張子を除く
                
                imageMap.set(key, {
                    path: filePath,
                    image: image,
                    metadata: {
                        width: image.getWidth(),
                        height: image.getHeight(),
                        size: fs.statSync(filePath).size,
                        lastModified: fs.statSync(filePath).mtime
                    }
                });
                
                console.log(`📸 Loaded ${type} image: ${file}`);
            } catch (error) {
                console.error(`❌ Error loading image ${file}:`, error.message);
            }
        }
    }
    
    startWatching() {
        // 元画像ディレクトリの監視
        const originalWatcher = chokidar.watch(this.config.originalDir, {
            ignored: /(^|[\/\\])\../, // 隠しファイルを無視
            persistent: true
        });
        
        // ターゲット画像ディレクトリの監視
        const targetWatcher = chokidar.watch(this.config.targetDir, {
            ignored: /(^|[\/\\])\../,
            persistent: true
        });
        
        originalWatcher
            .on('add', (filePath) => this.handleFileChange(filePath, 'original', 'added'))
            .on('change', (filePath) => this.handleFileChange(filePath, 'original', 'changed'))
            .on('unlink', (filePath) => this.handleFileChange(filePath, 'original', 'removed'));
            
        targetWatcher
            .on('add', (filePath) => this.handleFileChange(filePath, 'target', 'added'))
            .on('change', (filePath) => this.handleFileChange(filePath, 'target', 'changed'))
            .on('unlink', (filePath) => this.handleFileChange(filePath, 'target', 'removed'));
    }
    
    async handleFileChange(filePath, type, action) {
        const fileName = path.basename(filePath);
        const key = path.parse(fileName).name;
        
        console.log(`🔄 File ${action}: ${type}/${fileName}`);
        
        if (action === 'removed') {
            if (type === 'original') {
                this.originalImages.delete(key);
            } else {
                this.targetImages.delete(key);
            }
        } else {
            try {
                if (/\.(jpg|jpeg|png|bmp|gif)$/i.test(fileName)) {
                    const image = await Jimp.read(filePath);
                    const imageData = {
                        path: filePath,
                        image: image,
                        metadata: {
                            width: image.getWidth(),
                            height: image.getHeight(),
                            size: fs.statSync(filePath).size,
                            lastModified: fs.statSync(filePath).mtime
                        }
                    };
                    
                    if (type === 'original') {
                        this.originalImages.set(key, imageData);
                    } else {
                        this.targetImages.set(key, imageData);
                    }
                }
            } catch (error) {
                console.error(`❌ Error processing ${fileName}:`, error.message);
                return;
            }
        }
        
        // 比較の実行
        await this.compareImages();
        
        // イベントの発行
        this.emit('fileChanged', {
            type,
            action,
            fileName,
            key,
            timestamp: new Date()
        });
    }
    
    async compareImages() {
        console.log('🔍 Comparing images...');
        
        // 共通のキーを取得
        const commonKeys = [...this.originalImages.keys()].filter(key => 
            this.targetImages.has(key)
        );
        
        for (const key of commonKeys) {
            const original = this.originalImages.get(key);
            const target = this.targetImages.get(key);
            
            const comparison = await this.compareImagePair(original, target, key);
            this.results.set(key, comparison);
            
            // 結果をファイルに保存
            await this.saveComparisonResult(key, comparison);
        }
        
        // サマリーの出力
        this.printSummary();
        
        this.emit('comparisonComplete', {
            results: this.results,
            timestamp: new Date()
        });
    }
    
    async compareImagePair(original, target, key) {
        const result = {
            key,
            timestamp: new Date(),
            original: original.metadata,
            target: target.metadata,
            differences: {},
            similarity: 0,
            status: 'compared'
        };
        
        try {
            // サイズの比較
            result.differences.size = {
                widthDiff: target.metadata.width - original.metadata.width,
                heightDiff: target.metadata.height - original.metadata.height,
                sizeDiff: target.metadata.size - original.metadata.size
            };
            
            // 画像の類似度計算（簡易版）
            const similarity = await this.calculateSimilarity(original.image, target.image);
            result.similarity = similarity;
            
            // 差分画像の生成
            const diffImage = await this.createDifferenceImage(original.image, target.image);
            const diffPath = path.join(this.config.outputDir, `${key}_diff.png`);
            await diffImage.writeAsync(diffPath);
            result.diffImagePath = diffPath;
            
            result.status = 'success';
            
        } catch (error) {
            console.error(`❌ Error comparing ${key}:`, error.message);
            result.status = 'error';
            result.error = error.message;
        }
        
        return result;
    }
    
    async calculateSimilarity(img1, img2) {
        // 画像を同じサイズにリサイズ
        const size = 100; // 比較用のサイズ
        const resized1 = img1.clone().resize(size, size);
        const resized2 = img2.clone().resize(size, size);
        
        let totalDiff = 0;
        let pixelCount = 0;
        
        resized1.scan(0, 0, resized1.bitmap.width, resized1.bitmap.height, function (x, y, idx) {
            const r1 = this.bitmap.data[idx + 0];
            const g1 = this.bitmap.data[idx + 1];
            const b1 = this.bitmap.data[idx + 2];
            
            const pixel2 = Jimp.intToRGBA(resized2.getPixelColor(x, y));
            const r2 = pixel2.r;
            const g2 = pixel2.g;
            const b2 = pixel2.b;
            
            const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
            totalDiff += diff;
            pixelCount++;
        });
        
        const maxDiff = pixelCount * 255 * 3; // 最大差分
        const similarity = (1 - (totalDiff / maxDiff)) * 100;
        
        return Math.round(similarity * 100) / 100; // 小数点2桁で四捨五入
    }
    
    async createDifferenceImage(img1, img2) {
        // 両方の画像を同じサイズにリサイズ
        const width = Math.max(img1.getWidth(), img2.getWidth());
        const height = Math.max(img1.getHeight(), img2.getHeight());
        
        const resized1 = img1.clone().resize(width, height);
        const resized2 = img2.clone().resize(width, height);
        
        const diffImage = new Jimp(width, height, 0x000000ff);
        
        diffImage.scan(0, 0, width, height, function (x, y, idx) {
            const pixel1 = Jimp.intToRGBA(resized1.getPixelColor(x, y));
            const pixel2 = Jimp.intToRGBA(resized2.getPixelColor(x, y));
            
            const rDiff = Math.abs(pixel1.r - pixel2.r);
            const gDiff = Math.abs(pixel1.g - pixel2.g);
            const bDiff = Math.abs(pixel1.b - pixel2.b);
            
            // 差分を強調表示
            const intensity = (rDiff + gDiff + bDiff) / 3;
            const color = Jimp.rgbaToInt(intensity * 2, intensity / 2, intensity / 2, 255);
            
            this.setPixelColor(color, x, y);
        });
        
        return diffImage;
    }
    
    async saveComparisonResult(key, result) {
        const resultPath = path.join(this.config.outputDir, `${key}_result.json`);
        const resultData = {
            ...result,
            image: undefined // 画像オブジェクトを除外
        };
        
        fs.writeFileSync(resultPath, JSON.stringify(resultData, null, 2));
    }
    
    printSummary() {
        console.log('\n📊 === Comparison Summary ===');
        console.log(`🔢 Total comparisons: ${this.results.size}`);
        
        if (this.results.size === 0) {
            console.log('❓ No matching pairs found');
            return;
        }
        
        const successful = [...this.results.values()].filter(r => r.status === 'success');
        const avgSimilarity = successful.reduce((sum, r) => sum + r.similarity, 0) / successful.length;
        
        console.log(`✅ Successful comparisons: ${successful.length}`);
        console.log(`📈 Average similarity: ${avgSimilarity.toFixed(2)}%`);
        
        console.log('\n📋 Individual Results:');
        for (const [key, result] of this.results) {
            if (result.status === 'success') {
                console.log(`  ${key}: ${result.similarity}% similarity`);
            } else {
                console.log(`  ${key}: ❌ ${result.error}`);
            }
        }
        console.log('========================\n');
    }
    
    getStatus() {
        return {
            originalImages: this.originalImages.size,
            targetImages: this.targetImages.size,
            comparisons: this.results.size,
            lastUpdate: new Date()
        };
    }
}

module.exports = ImageMonitor;
