import fetch from "cross-fetch";

interface SNPInfo {
  id: string;
  gene: string;
}

interface GenotypeRAG {
  genotype: string;
  rag: string;
}

interface SNPDetailsResult {
  snp: string;
  gene: string;
  ancestralAllele: string;
  alleles: string[];
  genotypes: GenotypeRAG[];
  consequences: string[];
}

const snps: SNPInfo[] = [
  { id: "rs1801131", gene: "MTHFR" },
  {
    gene: "DHFR",
    id: "rs70991108",
  },
  {
    gene: "FOLH1",
    id: "rs202700",
  },
  {
    gene: "MTHFD1",
    id: "rs1076991",
  },
  {
    gene: "MTHFD1",
    id: "rs2236225",
  },
  {
    gene: "MTHFR",
    id: "rs1801131",
  },
  {
    gene: "MTHFR",
    id: "rs1801133",
  },
  {
    gene: "MTR",
    id: "rs1805087",
  },
  {
    gene: "SHMT1",
    id: "rs1979277",
  },
  {
    gene: "Tyms",
    id: "rs2790",
  },
  {
    gene: "AHCY",
    id: "rs121918608",
  },
  {
    gene: "BHMT",
    id: "rs3733890",
  },
  {
    gene: "BHMT",
    id: "rs567754",
  },
  {
    gene: "BHMT",
    id: "rs651852",
  },
  {
    gene: "CHDH",
    id: "rs12676",
  },
  {
    gene: "FuT2",
    id: "rs1047781",
  },
  {
    gene: "FuT2",
    id: "rs601338",
  },
  {
    gene: "MATIA",
    id: "rs1985908",
  },
  {
    gene: "MTRR",
    id: "rs162036",
  },
  {
    gene: "MTRR",
    id: "rs1801394",
  },
  {
    gene: "MTR",
    id: "rs1805087",
  },
];

const generateGenotypeCombinations = (alleles: string[]): string[] => {
  let combinations = new Set<string>();
  alleles.forEach((allele1) => {
    alleles.forEach((allele2) => {
      combinations.add(`${allele1}${allele2}`);
    });
  });
  return Array.from(combinations);
};

const fetchVEPData = async (snpId: string): Promise<string[]> => {
  const vepUrl = `https://rest.ensembl.org/vep/human/id/${snpId}?content-type=application/json`;
  try {
    const response = await fetch(vepUrl);
    const data = (await response.json()) as any[];
    const consequences = data.map((item) => item.most_severe_consequence);
    return consequences;
  } catch (error) {
    console.error("Error fetching VEP data for", snpId, ": ", error);
    return [];
  }
};

const fetchSNPDetails = async (
  snp: SNPInfo
): Promise<SNPDetailsResult | null> => {
  const detailsUrl = `https://rest.ensembl.org/variation/human/${snp.id}?content-type=application/json`;
  try {
    const response = await fetch(detailsUrl);
    const detailsData = (await response.json()) as any;
    const ancestralAllele =
      detailsData.mappings?.[0]?.ancestral_allele ?? "Unknown";
    const alleles = detailsData.mappings?.[0]?.allele_string?.split("/") ?? [];

    const consequences = await fetchVEPData(snp.id);
    const genotypes = generateGenotypeCombinations(alleles).map((genotype) => {
      // Simplify RAG logic based on VEP consequences (for demonstration)
      const rag = consequences.includes("missense_variant")
        ? "Amber"
        : consequences.includes("NMD_transcript_variant")
        ? "Red"
        : "Green";
      return { genotype, rag };
    });

    return {
      snp: snp.id,
      gene: snp.gene,
      ancestralAllele,
      alleles,
      genotypes,
      consequences,
    };
  } catch (error) {
    console.error("Error fetching SNP details for", snp.id, ": ", error);
    return null;
  }
};

const determineRAGValues = async (): Promise<void> => {
  const results = await Promise.all(snps.map(fetchSNPDetails));
  results.forEach((result) => {
    if (result) {
      console.log(`SNP: ${result.snp}, Gene: ${result.gene}`);
      console.log(`Ancestral Allele: ${result.ancestralAllele}`);
      console.log(`Associated Alleles: ${result.alleles.join(", ")}`);
      result.genotypes.forEach((genotype) => {
        console.log(`  Genotype: ${genotype.genotype}, RAG: ${genotype.rag}`);
      });
    }
  });
};

determineRAGValues();
