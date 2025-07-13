const PersonImageProcessor = require('./personImageProcessor');

async function main() {
    console.log('🎯 人物画像処理システムを開始します...');
    
    const processor = new PersonImageProcessor({
        inputDir: './data/seated_photos',
        outputDir: './data/processed',
        modelsDir: './models',
        targetWidth: 800,
        targetHeight: 1200,
        headTopMargin: 50
    });
    
    // 処理の進行状況を監視
    processor.on('imageProcessed', (data) => {
        const percentage = Math.round(data.progress * 100);
        console.log(`📊 進行状況: ${percentage}% - ${data.file} 完了`);
    });
    
    try {
        // システムの初期化
        const initialized = await processor.init();
        if (!initialized) {
            console.error('❌ システムの初期化に失敗しました');
            process.exit(1);
        }
        
        // 全画像の処理を実行
        const results = await processor.processAllImages();
        
        // 結果のサマリーを表示
        console.log('\n📊 === 処理結果サマリー ===');
        const successful = results.filter(r => r.success);
        const withFaces = successful.filter(r => r.faceDetected);
        const withOCR = successful.filter(r => r.ocr && (r.ocr.numbers || r.ocr.name));
        
        console.log(`✅ 成功: ${successful.length}/${results.length} 枚`);
        console.log(`👤 顔検出: ${withFaces.length}/${successful.length} 枚`);
        console.log(`📝 文字認識: ${withOCR.length}/${successful.length} 枚`);
        
        if (withOCR.length > 0) {
            console.log('\n📋 認識された情報:');
            withOCR.forEach(result => {
                const ocr = result.ocr;
                console.log(`  ${result.filename}: ${ocr.numbers || '番号なし'}, ${ocr.name || '氏名なし'}`);
            });
        }
        
        console.log('\n🎉 すべての処理が完了しました！');
        console.log(`📁 処理済み画像は ${processor.config.outputDir} に保存されました`);
        
    } catch (error) {
        console.error('❌ 処理中にエラーが発生しました:', error);
        process.exit(1);
    }
}

// スクリプトとして実行された場合
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 予期しないエラー:', error);
        process.exit(1);
    });
}

module.exports = { main };
