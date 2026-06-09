import { Play, Radio, Sparkles } from "lucide-react";

export function CoverPreview() {
  return (
    <section className="cover-preview" aria-label="封面和演示视频预览">
      <div className="cover-preview__header">
        <div>
          <p className="eyebrow">Demo Preview</p>
          <h2>赛前情报封面</h2>
        </div>
        <button className="icon-button" title="播放演示预览" type="button">
          <Play aria-hidden="true" size={18} />
        </button>
      </div>

      <div className="pitch-visual" aria-hidden="true">
        <div className="pitch-visual__line pitch-visual__line--mid" />
        <div className="pitch-visual__box pitch-visual__box--left" />
        <div className="pitch-visual__box pitch-visual__box--right" />
        <span className="tracking-dot tracking-dot--one" />
        <span className="tracking-dot tracking-dot--two" />
        <span className="tracking-dot tracking-dot--three" />
      </div>

      <div className="preview-strip">
        <span>
          <Radio aria-hidden="true" size={16} />
          RAG 引用
        </span>
        <span>
          <Sparkles aria-hidden="true" size={16} />
          概率模型
        </span>
        <span>00:24</span>
      </div>
    </section>
  );
}
