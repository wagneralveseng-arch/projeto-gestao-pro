import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";

export default function Materiais() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Materiais</h1>
          <p className="text-muted-foreground">Gerencie seus materiais de construção</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Esta página está em desenvolvimento.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
