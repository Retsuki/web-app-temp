import { Card } from '@/components/ui/card'

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">利用規約</h1>

      <Card className="p-6">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <p className="mb-4">
            本規約は、当サービス（以下「本サービス」といいます）の利用条件を定めるものです。
            登録ユーザーの皆さま（以下「ユーザー」といいます）には、本規約に従って本サービスをご利用いただきます。
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">第1条（適用）</h2>
          <p className="mb-4">
            本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">第2条（利用登録）</h2>
          <ol className="list-decimal pl-6 mb-4">
            <li className="mb-2">
              登録希望者が当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
            </li>
            <li className="mb-2">
              当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります。
              <ul className="list-disc pl-6 mt-2">
                <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                <li>本規約に違反したことがある者からの申請である場合</li>
                <li>その他、当社が利用登録を相当でないと判断した場合</li>
              </ul>
            </li>
          </ol>

          <h2 className="text-xl font-semibold mt-6 mb-3">
            第3条（ユーザーIDおよびパスワードの管理）
          </h2>
          <ol className="list-decimal pl-6 mb-4">
            <li className="mb-2">
              ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。
            </li>
            <li className="mb-2">
              ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与することはできません。
            </li>
          </ol>

          <h2 className="text-xl font-semibold mt-6 mb-3">第4条（禁止事項）</h2>
          <p className="mb-2">
            ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>
              当社、本サービスの他のユーザー、またはその他第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為
            </li>
            <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
            <li>本サービスの運営を妨害するおそれのある行為</li>
            <li>不正アクセスをし、またはこれを試みる行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>他のユーザーに成りすます行為</li>
            <li>その他、当社が不適切と判断する行為</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">第5条（本サービスの提供の停止等）</h2>
          <ol className="list-decimal pl-6 mb-4">
            <li className="mb-2">
              当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
              <ul className="list-disc pl-6 mt-2">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>
                  地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合
                </li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
            </li>
            <li className="mb-2">
              当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
            </li>
          </ol>

          <h2 className="text-xl font-semibold mt-6 mb-3">第6条（免責事項）</h2>
          <ol className="list-decimal pl-6 mb-4">
            <li className="mb-2">
              当社の債務不履行責任は、当社の故意または重過失によらない場合には免責されるものとします。
            </li>
            <li className="mb-2">
              当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
            </li>
          </ol>

          <h2 className="text-xl font-semibold mt-6 mb-3">第7条（サービス内容の変更等）</h2>
          <p className="mb-4">
            当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">第8条（利用規約の変更）</h2>
          <p className="mb-4">
            当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
            なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">第9条（準拠法・裁判管轄）</h2>
          <ol className="list-decimal pl-6 mb-4">
            <li className="mb-2">本規約の解釈にあたっては、日本法を準拠法とします。</li>
            <li className="mb-2">
              本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
            </li>
          </ol>

          <p className="mt-8 text-sm text-gray-600 dark:text-gray-400">最終更新日：2025年1月30日</p>
        </div>
      </Card>
    </div>
  )
}
