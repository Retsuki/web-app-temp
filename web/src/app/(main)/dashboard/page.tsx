import { signOut } from "@/lib/auth/actions";
import { requireAuth } from "@/lib/auth/server-helpers";
import { ProfileEdit } from "./profile-edit";

export default async function DashboardPage() {
  const { profile, error } = await requireAuth();

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                ダッシュボード
              </h1>

              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="text-sm font-medium">
                  サーバーエラーが発生しました
                </p>
                <p className="text-xs mt-1">
                  何か問題が発生しました。しばらくしてからもう一度お試しください。
                </p>
              </div>

              <form action={signOut}>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  サインアウト
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ダッシュボード
            </h1>

            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <p className="text-sm">✅ 成功</p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                基本情報
              </h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {profile.userId}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    ニックネーム
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.nickname}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    メールアドレス
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Created
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(profile.createdAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Client Componentの例 */}
            <ProfileEdit />

            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {t('common.signOut')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
