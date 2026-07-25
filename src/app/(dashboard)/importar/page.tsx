import { getExpenseCategories } from "@/app/actions/categories";
import { ImportForm } from "@/components/import-form";

export default async function ImportarPage() {
  const categories = await getExpenseCategories();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Importar gasto</h2>
        <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
          Pega el texto de la notificacion de tu tarjeta, Mercado Pago o banco
        </p>
      </div>
      <ImportForm categories={categories} />
    </div>
  );
}
