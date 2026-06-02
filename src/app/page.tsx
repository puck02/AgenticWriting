import { AppNav } from "@/components/AppNav";
import { EssaySubmitForm } from "@/components/EssaySubmitForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper">
      <AppNav />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <p className="text-sm font-semibold text-sky-700">新建批改</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
              作文批改工作台
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              提交题目和正文后，系统会给出总分、摘要和逐句表达建议，并根据你的采纳反馈沉淀个人画像。
            </p>
          </div>
          <EssaySubmitForm />
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">提交前检查</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>题干信息完整，尤其是图表数据和应用文对象。</li>
              <li>正文保持原始表达，便于识别真实薄弱点。</li>
              <li>采纳建议后，常用表达会进入个人表达库。</li>
            </ul>
          </section>
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">批改重点</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-slate-800">准确性</dt>
                <dd className="mt-1 text-slate-600">语法、搭配和句意是否稳定。</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">丰富度</dt>
                <dd className="mt-1 text-slate-600">表达是否适合考研写作但不过度复杂。</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">连贯性</dt>
                <dd className="mt-1 text-slate-600">段落推进和句间衔接是否清楚。</dd>
              </div>
            </dl>
          </section>
        </aside>
      </section>
    </main>
  );
}
