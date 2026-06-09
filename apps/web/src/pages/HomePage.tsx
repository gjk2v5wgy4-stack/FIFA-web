import { BadgeCheck, FileSearch, LogIn, UserPlus } from "lucide-react";
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
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function HomePage({
  accountStatus,
  prediction,
  onOpenPrediction,
  onOpenLogin,
  onOpenRegister,
}: HomePageProps) {
  return (
    <div className="page-stack">
      <div className="page-top-actions" aria-label="账号操作">
        <button className="secondary-button" onClick={onOpenLogin} type="button">
          <LogIn aria-hidden="true" size={16} />
          登录
        </button>
        <button className="primary-button" onClick={onOpenRegister} type="button">
          <UserPlus aria-hidden="true" size={16} />
          注册
        </button>
      </div>

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

      <ResultPreview prediction={prediction} />
    </div>
  );
}
