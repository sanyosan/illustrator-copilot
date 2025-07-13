# 大容量ファイルの取り扱いについて

## 📁 GitHubの制限

GitHubでは以下の制限があります：
- **単一ファイル**: 100MB まで
- **リポジトリ全体**: 1GB 推奨、5GB まで
- **プッシュ**: 2GB まで

## 🖼️ 画像ファイルの管理

### 解決策

1. **Git LFS (Large File Storage)の使用**
   ```bash
   git lfs install
   git lfs track "*.jpg"
   git lfs track "*.png"
   git add .gitattributes
   ```

2. **外部ストレージの使用**
   - Google Drive
   - Dropbox
   - AWS S3
   - GitHub Releases（大きなファイル用）

3. **サンプルファイルの提供**
   - 小さなテスト用画像を提供
   - ダウンロードリンクを README に記載

### 現在の設定

`.gitignore` ファイルで以下のファイルを除外しています：

```
# 画像ファイル
*.jpg, *.jpeg, *.png, *.gif, *.bmp

# データフォルダ
data/original/*
data/target/*
data/seated_photos/*
data/processed/
output/

# AIモデル
models/*
```

## 🚀 推奨ワークフロー

### 開発者向け

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/sanyosan/illustrator-copilot.git
   cd illustrator-copilot
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   ```

3. **テスト用画像を配置**
   - `data/seated_photos/` に人物画像
   - `data/original/` と `data/target/` に比較用画像

4. **処理を実行**
   ```bash
   # Webインターフェース
   npm start

   # コマンドライン
   npm run process
   ```

### サンプル画像の入手

テスト用の画像は以下から入手できます：

1. **フリー素材サイト**
   - Unsplash (https://unsplash.com/)
   - Pixabay (https://pixabay.com/)
   - Pexels (https://www.pexels.com/)

2. **AI生成画像**
   - DALL-E
   - Midjourney
   - Stable Diffusion

## ⚠️ 注意事項

- **著作権**: 使用する画像の著作権に注意
- **プライバシー**: 人物画像は適切な許可を得てから使用
- **ファイルサイズ**: 大きすぎる画像は処理時間が長くなります

## 📞 サポート

大容量ファイルの取り扱いでお困りの場合は、以下の方法でサポートを受けられます：

1. GitHub Issues で質問
2. Git LFS の設定サポート
3. 外部ストレージ連携のサポート
