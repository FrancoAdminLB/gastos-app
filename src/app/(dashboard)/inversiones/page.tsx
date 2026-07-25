import { getInvestmentAccounts } from "@/app/actions/investments";
import { InvestmentPortfolio } from "@/components/investment-portfolio";

export default async function InversionesPage() {
  const accounts = await getInvestmentAccounts();

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Ahorro e Inversión</h2>
      <InvestmentPortfolio accounts={accounts} />
    </div>
  );
}
