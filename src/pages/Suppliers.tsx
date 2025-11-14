import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import suppliersData from "@/data/madeireiras.csv";

interface Supplier {
  Rede: string;
  Bairro: string;
  Município: string;
  UF: string;
  Endereço: string;
  CEP: string;
  Telefone: string;
  Contato: string;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  
  const [selectedRede, setSelectedRede] = useState("");
  const [selectedBairro, setSelectedBairro] = useState("");
  const [selectedMunicipio, setSelectedMunicipio] = useState("");
  const [selectedUF, setSelectedUF] = useState("");
  
  const [searchRede, setSearchRede] = useState("");
  const [searchBairro, setSearchBairro] = useState("");
  const [searchMunicipio, setSearchMunicipio] = useState("");
  const [searchUF, setSearchUF] = useState("");

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [selectedRede, selectedBairro, selectedMunicipio, selectedUF, suppliers]);

  const loadSuppliers = async () => {
    try {
      const response = await fetch(suppliersData);
      const text = await response.text();
      const lines = text.split('\n').slice(1);
      
      const parsedSuppliers: Supplier[] = lines
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          return {
            Rede: values[0] || '',
            Bairro: values[1] || '',
            Município: values[2] || '',
            UF: values[3] || '',
            Endereço: values[4] || '',
            CEP: values[5] || '',
            Telefone: values[6] || '',
            Contato: values[7] || '',
          };
        });

      setSuppliers(parsedSuppliers);
      setFilteredSuppliers(parsedSuppliers);
    } catch (error) {
      console.error('Erro ao carregar madeireiras:', error);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers;

    if (selectedRede) {
      filtered = filtered.filter(s => s.Rede === selectedRede);
    }
    if (selectedBairro) {
      filtered = filtered.filter(s => s.Bairro === selectedBairro);
    }
    if (selectedMunicipio) {
      filtered = filtered.filter(s => s.Município === selectedMunicipio);
    }
    if (selectedUF) {
      filtered = filtered.filter(s => s.UF === selectedUF);
    }

    setFilteredSuppliers(filtered);
  };

  const getUniqueValues = (field: keyof Supplier, searchTerm: string) => {
    const values = [...new Set(suppliers.map(s => s[field]).filter(Boolean))];
    if (!searchTerm) return values;
    return values.filter(v => 
      v.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Madeireiras</h1>
            <p className="text-muted-foreground">Lista de madeireiras cadastradas</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Rede</Label>
                <Select value={selectedRede} onValueChange={setSelectedRede}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as redes" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Pesquisar rede..."
                        value={searchRede}
                        onChange={(e) => setSearchRede(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <SelectItem value="all">Todas as redes</SelectItem>
                    {getUniqueValues('Rede', searchRede).map((rede) => (
                      <SelectItem key={rede} value={rede}>
                        {rede}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bairro</Label>
                <Select value={selectedBairro} onValueChange={setSelectedBairro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os bairros" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Pesquisar bairro..."
                        value={searchBairro}
                        onChange={(e) => setSearchBairro(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <SelectItem value="all">Todos os bairros</SelectItem>
                    {getUniqueValues('Bairro', searchBairro).map((bairro) => (
                      <SelectItem key={bairro} value={bairro}>
                        {bairro}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Município</Label>
                <Select value={selectedMunicipio} onValueChange={setSelectedMunicipio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os municípios" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Pesquisar município..."
                        value={searchMunicipio}
                        onChange={(e) => setSearchMunicipio(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <SelectItem value="all">Todos os municípios</SelectItem>
                    {getUniqueValues('Município', searchMunicipio).map((municipio) => (
                      <SelectItem key={municipio} value={municipio}>
                        {municipio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>UF</Label>
                <Select value={selectedUF} onValueChange={setSelectedUF}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as UFs" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Pesquisar UF..."
                        value={searchUF}
                        onChange={(e) => setSearchUF(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <SelectItem value="all">Todas as UFs</SelectItem>
                    {getUniqueValues('UF', searchUF).map((uf) => (
                      <SelectItem key={uf} value={uf}>
                        {uf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSuppliers.map((supplier, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{supplier.Rede}</CardTitle>
                  <Badge variant="outline">{supplier.UF}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Bairro:</span> {supplier.Bairro}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Município:</span> {supplier.Município}
                </div>
                {supplier.Endereço && (
                  <div className="text-sm">
                    <span className="font-medium">Endereço:</span> {supplier.Endereço}
                  </div>
                )}
                {supplier.CEP && (
                  <div className="text-sm">
                    <span className="font-medium">CEP:</span> {supplier.CEP}
                  </div>
                )}
                {supplier.Telefone && (
                  <div className="text-sm">
                    <span className="font-medium">Telefone:</span> {supplier.Telefone}
                  </div>
                )}
                {supplier.Contato && (
                  <div className="text-sm">
                    <span className="font-medium">Contato:</span> {supplier.Contato}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSuppliers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Nenhuma madeireira encontrada com os filtros selecionados.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
