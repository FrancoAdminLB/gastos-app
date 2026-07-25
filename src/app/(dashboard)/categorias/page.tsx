import { getCategories } from "@/app/actions/categories";
import { getBudgets } from "@/app/actions/budgets";
import { getCreditCards } from "@/app/actions/credit-cards";
import { getFamilyMembers } from "@/app/actions/family-members";
import { CategoryManager } from "@/components/category-manager";
import { CreditCardManager } from "@/components/credit-card-manager";
import { FamilyMemberManager } from "@/components/family-member-manager";
import { ChangePassword } from "@/components/change-password";

export default async function CategoriasPage() {
  const [categories, budgets, creditCards, familyMembers] = await Promise.all([
    getCategories(),
    getBudgets(),
    getCreditCards(),
    getFamilyMembers(),
  ]);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Ajustes</h2>
      <CreditCardManager cards={creditCards} isAdmin={true} />
      <FamilyMemberManager members={familyMembers} isAdmin={true} />
      <CategoryManager
        categories={categories}
        budgets={budgets}
        isAdmin={true}
      />
      <ChangePassword />
    </div>
  );
}
