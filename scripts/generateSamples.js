const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * テスト用のサンプル画像を生成するスクリプト
 * GitHubの容量制限を考慮して、小さなサンプル画像を作成
 */
class SampleImageGenerator {
    constructor() {
        this.sampleDir = './samples';
        this.originalDir = './data/original';
        this.targetDir = './data/target';
        this.seatedDir = './data/seated_photos';
    }
    
    async createSampleImages() {
        console.log('🎨 サンプル画像を生成中...');
        
        try {
            // ディレクトリの作成
            await this.ensureDirectories();
            
            // 各種サンプル画像の生成
            await this.createComparisonSamples();
            await this.createPersonSamples();
            
            console.log('✅ サンプル画像の生成が完了しました');
            console.log(`📁 サンプル画像は ${this.sampleDir} フォルダに保存されました`);
            
        } catch (error) {
            console.error('❌ サンプル画像生成エラー:', error);
        }
    }
    
    async ensureDirectories() {
        const dirs = [this.sampleDir];
        
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
            }
        }
    }
    
    async createComparisonSamples() {
        console.log('📸 画像比較用サンプルを生成中...');
        
        // 元画像のサンプル
        const originalImage = sharp({
            create: {
                width: 400,
                height: 300,
                channels: 3,
                background: { r: 100, g: 150, b: 200 }
            }
        });
        
        await originalImage
            .png()
            .toFile(path.join(this.sampleDir, 'sample_original.png'));
        
        // 目標画像のサンプル（少し違いを付ける）
        const targetImage = sharp({
            create: {
                width: 400,
                height: 300,
                channels: 3,
                background: { r: 120, g: 170, b: 220 }
            }
        });
        
        await targetImage
            .png()
            .toFile(path.join(this.sampleDir, 'sample_target.png'));
        
        console.log('✅ 画像比較用サンプル完了');
    }
    
    async createPersonSamples() {
        console.log('👤 人物画像用サンプルを生成中...');
        
        // 人物着座画像のサンプル（縦長）
        const personImage = sharp({
            create: {
                width: 600,
                height: 800,
                channels: 3,
                background: { r: 240, g: 240, b: 240 }
            }
        });
        
        // 顔の位置を示す円を描画（簡易版）
        const svgText = `
        <svg width="600" height="800">
            <rect width="600" height="800" fill="rgb(240,240,240)"/>
            <circle cx="300" cy="200" r="50" fill="rgb(255,220,177)" stroke="rgb(0,0,0)" stroke-width="2"/>
            <rect x="200" y="600" width="200" height="100" fill="white" stroke="rgb(0,0,0)" stroke-width="2"/>
            <text x="300" y="640" text-anchor="middle" font-family="Arial" font-size="16" fill="black">1234</text>
            <text x="300" y="670" text-anchor="middle" font-family="Arial" font-size="16" fill="black">田中太郎</text>
        </svg>`;
        
        await sharp(Buffer.from(svgText))
            .png()
            .toFile(path.join(this.sampleDir, 'sample_person.png'));
        
        console.log('✅ 人物画像用サンプル完了');
    }
}

// README用の説明も生成
async function generateSampleReadme() {
    const readmeContent = `# サンプル画像

このフォルダには、システムのテスト用サンプル画像が含まれています。

## 📁 ファイル一覧

### 画像比較用
- \`sample_original.png\` - 元画像のサンプル (400x300px)
- \`sample_target.png\` - 目標画像のサンプル (400x300px)

### 人物画像処理用
- \`sample_person.png\` - 着座人物のサンプル画像 (600x800px)
  - 顔の位置を示す円
  - ホワイトボードエリア（番号と氏名）

## 🚀 使用方法

### 1. 画像比較のテスト
\`\`\`bash
# サンプル画像をコピー
cp samples/sample_original.png data/original/sample.png
cp samples/sample_target.png data/target/sample.png

# システム起動
npm start
\`\`\`

### 2. 人物画像処理のテスト
\`\`\`bash
# サンプル画像をコピー
cp samples/sample_person.png data/seated_photos/person001.png

# 処理実行
npm run process
\`\`\`

## ⚠️ 注意

- これらは動作確認用のサンプル画像です
- 実際の画像を使用する場合は、適切な解像度と品質の画像を使用してください
- 人物画像処理では、実際の顔写真が必要です（AIの顔検出機能をテストするため）

## 🔧 カスタマイズ

\`scripts/generateSamples.js\` を実行することで、新しいサンプル画像を生成できます：

\`\`\`bash
node scripts/generateSamples.js
\`\`\`
`;

    const sampleDir = './samples';
    try {
        await fs.access(sampleDir);
    } catch {
        await fs.mkdir(sampleDir, { recursive: true });
    }
    
    await fs.writeFile(path.join(sampleDir, 'README.md'), readmeContent);
}

// スクリプトとして実行された場合
if (require.main === module) {
    async function main() {
        const generator = new SampleImageGenerator();
        await generator.createSampleImages();
        await generateSampleReadme();
    }
    
    main().catch(console.error);
}

module.exports = SampleImageGenerator;
