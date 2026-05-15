import d1 from "./d1.json";
import d2 from "./d2.json";
import d3 from "./d3.json";
import d4 from "./d4.json";
import d5 from "./d5.json";
import d6 from "./d6.json";
import d7 from "./d7.json";
import d8 from "./d8.json";
import d9 from "./d9.json";

export type IsoQuestion = {
  id: string;
  domainId: string;
  domainName?: string;
  controlCode?: string;
  question: string;
  helpText?: string;
  expectedEvidence?: string[];
  severity?: string;
  weight?: number;
  appliesTo?: unknown;
  source?: string;
};

export type IsoDomainFile = {
  domain: { id: string; code?: string; name: string; shortName?: string; description?: string };
  coreQuestions?: IsoQuestion[];
  sectorQuestions?: IsoQuestion[];
};

export const ALL_DOMAINS: IsoDomainFile[] = [
  d1 as IsoDomainFile,
  d2 as IsoDomainFile,
  d3 as IsoDomainFile,
  d4 as IsoDomainFile,
  d5 as IsoDomainFile,
  d6 as IsoDomainFile,
  d7 as IsoDomainFile,
  d8 as IsoDomainFile,
  d9 as IsoDomainFile,
];

export function getDomain(id: string): IsoDomainFile | null {
  return ALL_DOMAINS.find((d) => d.domain.id === id) ?? null;
}

export function getAllQuestions(): IsoQuestion[] {
  const out: IsoQuestion[] = [];
  for (const d of ALL_DOMAINS) {
    if (Array.isArray(d.coreQuestions)) out.push(...d.coreQuestions);
    if (Array.isArray(d.sectorQuestions)) out.push(...d.sectorQuestions);
  }
  return out;
}

export function findQuestion(id: string): IsoQuestion | null {
  return getAllQuestions().find((q) => q.id === id) ?? null;
}
