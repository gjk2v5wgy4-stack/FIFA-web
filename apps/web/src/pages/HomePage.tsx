import { LogIn, UserPlus } from "lucide-react";
import { CoverPreview } from "../components/CoverPreview";
import { ResultPreview } from "../components/ResultPreview";
import type { MatchPredictionStub } from "../services/apiStubs";

interface HomePageProps {
  prediction: MatchPredictionStub | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function HomePage({
  prediction,
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
        <CoverPreview />
      </section>

      <ResultPreview prediction={prediction} />
    </div>
  );
}
