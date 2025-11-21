import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Customers from "@/pages/Customers";
import RegisteredSuppliers from "@/pages/RegisteredSuppliers";
import { Employees } from "@/components/Employees";

export default function Registration() {
  return (
    <Layout>
      <div className="space-y-6">
        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customers">Clientes</TabsTrigger>
            <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
            <TabsTrigger value="employees">Funcionários</TabsTrigger>
          </TabsList>
          
          <TabsContent value="customers">
            <Customers />
          </TabsContent>
          
          <TabsContent value="suppliers">
            <RegisteredSuppliers />
          </TabsContent>
          
          <TabsContent value="employees">
            <Employees />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
