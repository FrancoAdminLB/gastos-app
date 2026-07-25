import { getCategories } from "@/app/actions/categories";
import { getBudgets } from "@/app/actions/budgets";
import { getCreditCards } from "@/app/actions/credit-cards";
import { getFamilyMembers } from "@/app/actions/family-members";
import { getCurrentUser } from "@/app/actions/auth";
import { CategoryManager } from "@/components/category-manager";
import { CreditCardManager } from "@/components/credit-card-manager";
import { FamilyMemberManager } from "@/components/family-member-manager";

export default async function CategoriasPage() {
  const [categories, budgets, creditCards, familyMembers, user] = await Promise.all([
    getCategories(),
    getBudgets(),
    getCreditCards(),
    getFamilyMembers(),
    getCurrentUser(),
  ]);

  const isAdmin = user?.rol === "admin" || user?.rol === "owner";

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Ajustes</h2>
      <CreditCardManager cards={creditCards} isAdmin={isAdmin} />
      <FamilyMemberManager members={familyMembers} isAdmin={isAdmin} />
      <CategoryManager
        categories={categories}
        budgets={budgets}
        isAdmin={isAdmin}
      />
    </div>
  );
}
