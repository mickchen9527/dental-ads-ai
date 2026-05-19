type PageHelpButtonProps = {
  purpose: string;
  when: string;
  focus: string[];
  next: string;
  mistakes: string[];
};

export function PageHelpButton({
  purpose,
  when,
  focus,
  next,
  mistakes,
}: PageHelpButtonProps) {
  return (
    <details className="group relative">
      <summary className="list-none rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100">
        这一页是干什么的？
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-md border border-slate-200 bg-white p-4 text-left shadow-lg">
        <HelpBlock title="这一页是干什么的" text={purpose} />
        <HelpBlock title="什么时候看" text={when} />
        <HelpList title="重点看哪几个数据" items={focus} />
        <HelpBlock title="看完以后做什么" text={next} />
        <HelpList title="常见误区" items={mistakes} />
      </div>
    </details>
  );
}

function HelpBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-b border-slate-100 py-2 first:pt-0 last:border-b-0">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function HelpList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border-b border-slate-100 py-2 last:border-b-0">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <ul className="mt-1 space-y-1 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
