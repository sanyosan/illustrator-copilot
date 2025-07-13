# データフォルダ

このフォルダには画像比較用のサンプルデータを配置します。

## フォルダ構造

- `original/` - 元画像（比較のベースとなる画像）
- `target/` - 目標画像（比較対象の画像）

## 使用方法

1. 同じファイル名（拡張子を除く）の画像を`original/`と`target/`に配置
2. システムが自動的に画像を検出し、比較を開始
3. 結果は`../output/`フォルダに出力されます

## 例

```
data/
├── original/
│   ├── logo.png
│   └── banner.jpg
└── target/
    ├── logo.png      # original/logo.png と比較される
    └── banner.jpg    # original/banner.jpg と比較される
```
