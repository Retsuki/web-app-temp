import { Card } from '@/components/ui/card'

export default function LegalPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">特定商取引法に基づく表記</h1>

      <Card className="p-6">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">販売業者</th>
                <td className="p-4">株式会社○○○○</td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">運営責任者</th>
                <td className="p-4">山田 太郎</td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">所在地</th>
                <td className="p-4">
                  〒100-0001
                  <br />
                  東京都千代田区千代田1-1-1
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">電話番号</th>
                <td className="p-4">03-1234-5678</td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">メールアドレス</th>
                <td className="p-4">info@example.com</td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">販売価格</th>
                <td className="p-4">
                  各商品・サービスごとに表示
                  <br />
                  ※すべて税込価格で表示しています
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">
                  商品代金以外の必要料金
                </th>
                <td className="p-4">
                  なし
                  <br />
                  ※インターネット接続料金、通信料金等はお客様のご負担となります
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">お支払い方法</th>
                <td className="p-4">
                  クレジットカード決済
                  <br />
                  （VISA、MasterCard、JCB、American Express、Diners Club）
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">お支払い時期</th>
                <td className="p-4">クレジットカード：ご注文時に決済されます</td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">
                  商品の引き渡し時期
                </th>
                <td className="p-4">
                  デジタルコンテンツ：決済完了後、即時利用可能
                  <br />
                  サブスクリプション：決済完了後、即時利用可能
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">
                  返品・交換について
                </th>
                <td className="p-4">
                  デジタルコンテンツの性質上、返品・交換はお受けできません。
                  <br />
                  ただし、コンテンツに重大な不具合がある場合はこの限りではありません。
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">解約について</th>
                <td className="p-4">
                  サブスクリプションサービスは、マイページよりいつでも解約可能です。
                  <br />
                  解約後も、現在の利用期間終了まではサービスをご利用いただけます。
                </td>
              </tr>
              <tr>
                <th className="text-left p-4 w-1/3 bg-gray-50 dark:bg-gray-800">動作環境</th>
                <td className="p-4">
                  推奨ブラウザ：
                  <br />
                  ・Google Chrome（最新版）
                  <br />
                  ・Safari（最新版）
                  <br />
                  ・Microsoft Edge（最新版）
                  <br />
                  ・Firefox（最新版）
                  <br />
                  <br />
                  推奨環境以外でのご利用は、正常に動作しない場合があります。
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded">
            <h2 className="text-lg font-semibold mb-2">注意事項</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>本表記は予告なく変更される場合があります。</li>
              <li>最新の情報は本ページにてご確認ください。</li>
              <li>ご不明な点がございましたら、お問い合わせフォームよりご連絡ください。</li>
            </ul>
          </div>

          <p className="mt-6 text-sm text-gray-600 dark:text-gray-400">最終更新日：2025年1月30日</p>
        </div>
      </Card>
    </div>
  )
}
