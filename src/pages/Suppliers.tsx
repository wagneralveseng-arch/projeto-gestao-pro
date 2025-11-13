import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Download, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  "Loja Concorrente": string;
  "Rede": string;
  "Bairro": string;
  "Municipios": string;
  "Estado": string;
  "UF": string;
  "Localizacao": string;
  "Territorio": string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedRede, setSelectedRede] = useState("all");
  const [selectedBairro, setSelectedBairro] = useState("all");
  const [selectedMunicipio, setSelectedMunicipio] = useState("all");

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [searchTerm, selectedState, selectedRede, selectedBairro, selectedMunicipio, suppliers]);

  const loadSuppliers = async () => {
    try {
      const response = await fetch("/src/data/madeireiras.csv");
      const text = await response.text();
      
      const lines = text.split("\n");
      const headers = lines[0].split(";");
      
      const data = lines.slice(1).map((line) => {
        const values = line.split(";");
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || "";
        });
        return obj as Supplier;
      }).filter(s => s["Loja Concorrente"]); // Remove empty rows

      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error) {
      console.error("Erro ao carregar madeireiras:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s["Loja Concorrente"].toLowerCase().includes(term) ||
          s["Municipios"].toLowerCase().includes(term) ||
          s["Bairro"].toLowerCase().includes(term) ||
          s["Estado"].toLowerCase().includes(term)
      );
    }

    if (selectedState !== "all") {
      filtered = filtered.filter((s) => s.UF === selectedState);
    }
    
    if (selectedRede !== "all") {
      filtered = filtered.filter((s) => s.Rede === selectedRede);
    }
    
    if (selectedBairro !== "all") {
      filtered = filtered.filter((s) => s.Bairro === selectedBairro);
    }
    
    if (selectedMunicipio !== "all") {
      filtered = filtered.filter((s) => s.Municipios === selectedMunicipio);
    }

    setFilteredSuppliers(filtered);
  };

  const states = Array.from(new Set(suppliers.map((s) => s.UF).filter(Boolean))).sort();
  const redes = Array.from(new Set(suppliers.map((s) => s.Rede).filter(Boolean))).sort();
  const bairros = Array.from(new Set(suppliers.map((s) => s.Bairro).filter(Boolean))).sort();
  const municipios = Array.from(new Set(suppliers.map((s) => s.Municipios).filter(Boolean))).sort();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Madeireiras</h1>
            <p className="text-muted-foreground">
              Lista completa de fornecedores de materiais
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, cidade, bairro..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={selectedRede} onValueChange={setSelectedRede}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Rede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Redes</SelectItem>
                  {redes.map((rede) => (
                    <SelectItem key={rede} value={rede}>
                      {rede}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBairro} onValueChange={setSelectedBairro}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Bairros</SelectItem>
                  {bairros.map((bairro) => (
                    <SelectItem key={bairro} value={bairro}>
                      {bairro}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMunicipio} onValueChange={setSelectedMunicipio}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Município" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Municípios</SelectItem>
                  {municipios.map((municipio) => (
                    <SelectItem key={municipio} value={municipio}>
                      {municipio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredSuppliers.length} Madeireiras Encontradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma madeireira encontrada com os filtros selecionados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Rede</TableHead>
                      <TableHead>Bairro</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Localização</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {supplier["Loja Concorrente"]}
                        </TableCell>
                        <TableCell>{supplier.Rede}</TableCell>
                        <TableCell>{supplier.Bairro}</TableCell>
                        <TableCell>{supplier.Municipios}</TableCell>
                        <TableCell>
                          <span className="font-semibold">{supplier.UF}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {supplier.Localizacao.substring(0, 50)}...
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
