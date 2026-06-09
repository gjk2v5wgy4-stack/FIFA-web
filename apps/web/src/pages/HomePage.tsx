import { BadgeCheck, FileSearch } from "lucide-react";
import { CoverPreview } from "../components/CoverPreview";
import { ResultPreview } from "../components/ResultPreview";
import type {
  AccountStatusSummary,
  MatchPredictionStub,
} from "../services/apiStubs";

interface HomePageProps {
  accountStatus: AccountStatusSummary | null;
  prediction: MatchPredictionStub | null;
  onOpenPrediction: () => void;
}

export function HomePage({
  accountStatus,
  prediction,
  onOpenPrediction,
}: HomePageProps) {
  return (
    <div className="page-stack">
      <section className="dashboard-hero">
        <div className="dashboard-hero__content">
          <p className="eyebrow">World Cup AI/RAG Intelligence</p>
          <h1>世界杯赛前数据分析工作台</h1>
          <p className="hero-copy">
            面向审批用户的概率预测、风险因素、RAG 引用和报告预览。当前页面使用前端
            stub 数据，等待后端合同接入。
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onOpenPrediction} type="button">
              <FileSearch aria-hidden="true" size={18} />
              查看预测 stub
            </button>
            <span className="inline-status">
              <BadgeCheck aria-hidden="true" size={18} />
              {accountStatus?.message ?? "正在读取账号状态"}
            </span>
          </div>
        </div>
        <CoverPreview />
      </section>

      <div className="two-column">
        <ResultPreview prediction={prediction} />
        <section className="workflow-panel">
          <div className="section-heading">
            <p className="eyebrow">MVP Flow</p>
            <h2>审批访问流程</h2>
          </div>
          <ol className="timeline-list">
            <li>
              <span>1</span>
              用户注册，默认进入 pending_approval。
            </li>
            <li>
              <span>2</span>
              管理员审批账号并授予初始 token 配额。
            </li>
            <li>
              <span>3</span>
              受保护的 RAG、预测、报告接口按请求扣减 token。
            </li>
            <li>
              <span>4</span>
              余额较低时提示联系管理员调整配额。
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
