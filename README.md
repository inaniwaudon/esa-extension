# esa-extension

情報共有サービスである [esa](https://esa.io/) を使いやすくする非公式 Chrome 拡張機能です。

## 機能

- **カテゴリ記事一覧表示**  
  記事ページにて、サイドバーの「CATEGORY」ボタンをクリックすると、同カテゴリに属する記事一覧を表示します。  
  CATEGORY ボタンは画面幅が一定以上の場合のみ表示されます。
- **スムーズな記事編集（実装中）**  
  ページ遷移を経ることなく、記事中の一部を編集します。

## 利用方法

本拡張機能は esa API を利用します。esa の「設定」→「外部アプリ連携」より[アクセストークン](https://docs.esa.io/posts/102)を取得し、`.env.local` に記述します。  
※ API のレートリミットに注意

```
VITE_ESA_TOKEN=<VITE_ESA_TOKEN>
```

依存関係をインストールしてビルドします。Chrome の「拡張機能」→「パッケージ化されていない拡張機能を読み込む」から、ビルドされた dist ディレクトリを読み込みます。

```
yarn
yarn run build
```