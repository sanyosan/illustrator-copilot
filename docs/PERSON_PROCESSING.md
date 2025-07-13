# 人物画像処理システム

## 概要

椅子に着座した人物の画像を、顔認証と文字認識（OCR）を使って縦長の規格化された画像に自動加工するシステムです。

## 機能

### 🔍 顔認証機能
- **顔検出**: AI による高精度な顔検出
- **顔中心配置**: 顔の中央を基準とした画像切り取り
- **頭上マージン**: 頭のてっぺんより50px上から切り取り開始

### 📝 文字認識（OCR）機能
- **4桁番号認識**: ホワイトボードに書かれた4桁の番号を自動認識
- **氏名認識**: 手書きの氏名を文字認識
- **日本語対応**: ひらがな、カタカナ、漢字の認識

### 🖼️ 画像加工機能
- **自動切り取り**: 顔を中心とした最適な範囲での切り取り
- **縦長変換**: 800x1200ピクセルの縦長フォーマットに統一
- **高品質出力**: JPEG品質90%での出力

## 使用方法

### 1. 画像の準備
```
data/
└── seated_photos/
    ├── person001.jpg
    ├── person002.jpg
    └── ...
```

### 2. 処理の実行

#### コマンドラインから実行
```bash
npm run process
```

#### Webインターフェースから実行
1. `npm start` でサーバーを起動
2. ブラウザで `http://localhost:3000` を開く
3. "画像処理を開始" ボタンをクリック

### 3. 結果の確認

処理済み画像と結果は `data/processed/` フォルダに保存されます：

```
data/
└── processed/
    ├── person001_processed.jpg  # 加工済み画像
    ├── person001_result.json    # 処理結果詳細
    ├── person002_processed.jpg
    ├── person002_result.json
    └── ...
```

## 結果ファイルの形式

### {filename}_result.json
```json
{
  "filename": "person001.jpg",
  "outputPath": "./data/processed/person001_processed.jpg",
  "success": true,
  "originalSize": { "width": 1920, "height": 1080 },
  "processedSize": { "width": 800, "height": 1200 },
  "faceDetected": true,
  "faceBox": {
    "x": 640,
    "y": 200,
    "width": 180,
    "height": 220
  },
  "ocr": {
    "rawText": "1234\n田中太郎",
    "numbers": "1234",
    "name": "田中太郎",
    "confidence": 0.85
  },
  "timestamp": "2025-07-13T10:30:00.000Z"
}
```

## 設定オプション

`src/personImageProcessor.js` で以下の設定を変更できます：

```javascript
const config = {
    inputDir: './data/seated_photos',     // 入力フォルダ
    outputDir: './data/processed',        // 出力フォルダ
    targetWidth: 800,                     // 出力画像の幅
    targetHeight: 1200,                   // 出力画像の高さ
    headTopMargin: 50                     // 頭上のマージン（px）
};
```

## 必要な依存関係

- **@vladmandic/face-api**: 顔認証
- **tesseract.js**: 文字認識（OCR）
- **sharp**: 高性能画像処理
- **canvas**: Canvas API実装

## トラブルシューティング

### 顔が検出されない場合
- 画像の解像度が十分か確認
- 顔が正面を向いているか確認
- 照明条件を改善

### 文字認識の精度が低い場合
- ホワイトボードの文字を太く、はっきりと書く
- 背景とのコントラストを高める
- 文字サイズを大きくする

### メモリ不足エラー
- 大量の画像を処理する場合は、バッチサイズを調整
- Node.jsのメモリ制限を増やす: `node --max-old-space-size=4096`
