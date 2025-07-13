# 🎨 イラレcopilot

Adobe Illustratorと連携する画像比較・モニタリングシステムです。元画像と目標画像をリアルタイムで比較し、差分を可視化してプログラム開発を支援します。

## 🌟 機能

- **リアルタイム画像監視**: フォルダ内の画像ファイルを自動監視
- **画像比較**: 元画像と目標画像の類似度を自動計算
- **差分可視化**: 画像間の差分を視覚的に表示
- **Webダッシュボード**: ブラウザで結果をリアルタイム監視
- **Socket.IO**: リアルタイム通信でライブ更新

## 📁 プロジェクト構造

```
illustrator-copilot/
├── src/
│   ├── index.js          # メインエントリーポイント
│   ├── server.js         # Webサーバー
│   └── imageMonitor.js   # 画像監視・比較エンジン
├── data/
│   ├── original/         # 元画像を配置
│   └── target/           # 目標画像を配置
├── output/               # 比較結果・差分画像
├── public/
│   └── index.html        # Webダッシュボード
└── package.json
```

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. サンプル画像の生成（オプション）

```bash
npm run samples
```

### 3. アプリケーションの起動

```bash
npm start
```

または開発モード（ファイル監視付き）：

```bash
npm run dev
```

### 4. Webダッシュボードにアクセス

ブラウザで `http://localhost:3000` を開きます。

## 📖 使用方法

### 基本的な使い方

1. **画像の配置**
   - 元画像を `data/original/` フォルダに配置
   - 目標画像を `data/target/` フォルダに配置
   - ファイル名を同じにする（例：`image1.png`）

2. **自動比較**
   - ファイルが配置されると自動的に比較が開始
   - 結果は `output/` フォルダに保存

3. **結果の確認**
   - Webダッシュボードでリアルタイム監視
   - JSON形式の詳細結果
   - 差分画像の生成

### サポートしている画像形式

- PNG
- JPEG/JPG
- BMP
- GIF

### API エンドポイント

- `GET /api/status` - システム状態の取得
- `GET /api/results` - 比較結果の取得
- `GET /output/` - 生成された差分画像・結果ファイル

## 🔧 設定

環境変数で設定を変更できます：

```bash
PORT=3000  # サーバーポート番号
```

## 📊 出力ファイル

各比較で以下のファイルが生成されます：

- `{filename}_diff.png` - 差分画像
- `{filename}_result.json` - 詳細な比較結果

## 🤝 開発に参加

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License

## 🛠 トラブルシューティング

### よくある問題

**Q: 画像が比較されない**
A: ファイル名が同じか確認してください（拡張子を除く）

**Q: サーバーが起動しない**
A: `npm install` でパッケージが正しくインストールされているか確認

**Q: 差分画像が生成されない**
A: 画像形式がサポートされているか確認（PNG、JPEG、BMP、GIF）

### 大容量ファイルの問題

**Q: GitHubにプッシュできない（ファイルサイズエラー）**
A: `.gitignore`で画像ファイルを除外しています。`docs/LARGE_FILES.md`を参照

**Q: テスト用の画像がない**
A: `npm run samples` でサンプル画像を生成できます

**Q: Git LFS を使いたい**
A: 大容量画像ファイルには Git LFS の使用を推奨します
```bash
git lfs install
git lfs track "*.jpg"
git lfs track "*.png"
```
