import type { SimplifiedDatabaseType } from "$lib/code/enums";

export type Model = Record<string, unknown>;

export type FriedaRcVars = {
  migrationsDirectory: string;
  generatedModelsDirectory: string;
};

export type FriedaVars = FriedaRcVars & {
  databaseUrl: string;
};

export type RawTableColumnInfo = {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string;
  Extra: string;
  Comment: string;
};

export type RawTableIndexInfo = {
  Table: string;
  Non_unique: string;
  Key_name: string;
  Seq_in_index: string;
  Column_name: string;
  Collation: string;
  Cardinality: string;
  Sub_part: string;
  Packed: string;
  Null: string;
  Index_type: string;
  Comment: string;
  Index_comment: string;
  Visible: string;
  Expression: string;
};
export type RawTableInfo = {
  name: string;
  columns: RawTableColumnInfo[];
  indexes: RawTableIndexInfo[];
  tableCreateStatement: string;
};

export type ParsedModelDef = {
  name: string;
  columns: ParsedColumnDef[];
  fullTextSearchIndexes: TableSearchIndexDefinition[];
};

export type ParsedColumnDef = {
  name: string;
  databaseType: SimplifiedDatabaseType;
  javascriptType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  hasDefault: boolean;
  maxStringLength: number | null;
  isCreatedAt: boolean;
  isUpdatedAt: boolean;
  isPrimaryKeyGenerated: boolean;
  isDefaultGenerated: boolean;
  isGeneratedAlways: boolean;
  isUnique: boolean;
};

export type TableSearchIndexDefinition = {
  tableName: string;
  indexedFields: string[];
  key: string;
};

export type RepoDefinition<M extends Model> = {
  name: string;
  columnKeys: (keyof M & string)[];
  primaryKeys: (keyof M & string)[];
  autoIncrementingPrimaryKey: (keyof M & string) | null;
  createdAtKeys: (keyof M & string)[];
  updatedAtKeys: (keyof M & string)[];
  jsonKeys: (keyof M & string)[];
};




