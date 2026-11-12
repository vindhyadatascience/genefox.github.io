# Package index

## TCGA

- [`gf_tcga_case_detail()`](https://genefox.app/r/reference/gf_tcga_case_detail.md)
  : One GDC case, as GeneFox's case detail screen shows it:
  demographics, each diagnosis with its stage and...
- [`gf_tcga_case_expression()`](https://genefox.app/r/reference/gf_tcga_case_expression.md)
  : One GDC case's whole-transcriptome RNA-seq (STAR counts), as
  GeneFox's case Expression tab shows it: genes...
- [`gf_tcga_cases()`](https://genefox.app/r/reference/gf_tcga_cases.md)
  : One page of a GDC cohort's case roster, as GeneFox's Cases tab lists
  it (sorted by submitter id): case...
- [`gf_tcga_chat_schema()`](https://genefox.app/r/reference/gf_tcga_chat_schema.md)
  : Read TCGA host capabilities, cohort-checked local suggestions and
  analysis tool schemas
- [`gf_tcga_cohort_summary()`](https://genefox.app/r/reference/gf_tcga_cohort_summary.md)
  : A GDC cohort's clinical make-up, as GeneFox's TCGA Summary tab shows
  it: case counts by sex at birth,...
- [`gf_tcga_compare_cohorts()`](https://genefox.app/r/reference/gf_tcga_compare_cohorts.md)
  : One gene's participant-level expression across several GDC cohorts
  on one common scale, as GeneFox's...
- [`gf_tcga_expression()`](https://genefox.app/r/reference/gf_tcga_expression.md)
  : One gene's expression (or CNV / methylation) across a TCGA or other
  GDC cohort, as GeneFox's Expression...
- [`gf_tcga_gene_isoforms()`](https://genefox.app/r/reference/gf_tcga_gene_isoforms.md)
  : One gene's transcript isoforms across a TCGA cohort, as GeneFox's
  Expression › Isoforms drill-in shows...
- [`gf_tcga_gene_signature()`](https://genefox.app/r/reference/gf_tcga_gene_signature.md)
  : Score a gene SET across one TCGA or other GDC cohort, as GeneFox's
  Gene Signature screen does: every gene...
- [`gf_tcga_pan_cancer_expression()`](https://genefox.app/r/reference/gf_tcga_pan_cancer_expression.md)
  : One gene's baseline-tumor expression across GeneFox's pan-cancer
  cohorts (65 GDC projects), per-cohort...
- [`gf_tcga_projects()`](https://genefox.app/r/reference/gf_tcga_projects.md)
  : List the GDC projects (cohorts) GeneFox's TCGA tab offers, grouped
  by program (TCGA, TARGET, CPTAC, ...)...
- [`gf_tcga_top_correlates()`](https://genefox.app/r/reference/gf_tcga_top_correlates.md)
  : Which genes' expression correlates with one gene across a TCGA or
  other GDC cohort's baseline tumors,...
- [`gf_tcga_tumor_normal()`](https://genefox.app/r/reference/gf_tcga_tumor_normal.md)
  : Compare one gene's expression in a TCGA project's baseline tumors
  with its adjacent normal tissue and the...

## GEO

- [`gf_geo_chat_schema()`](https://genefox.app/r/reference/gf_geo_chat_schema.md)
  : Read GEO host capabilities, bounded untrusted local suggestions and
  tool schemas for a matrix
- [`gf_geo_collection_summary()`](https://genefox.app/r/reference/gf_geo_collection_summary.md)
  : Summarize explicit GEO series from family SOFT metadata, retaining
  repeated characteristics and provenance
- [`gf_geo_dataset_details()`](https://genefox.app/r/reference/gf_geo_dataset_details.md)
  : A GEO series' record as GeneFox's dataset detail screen shows it:
  title, summary, organism, platform...
- [`gf_geo_finder_plan()`](https://genefox.app/r/reference/gf_geo_finder_plan.md)
  : Plan GEO searches without executing them or using a model
- [`gf_geo_gene_correlation()`](https://genefox.app/r/reference/gf_geo_gene_correlation.md)
  : Correlate two genes (or probes) across a GEO series' samples, as
  GeneFox's GEO Expression Gene Correlation...
- [`gf_geo_search()`](https://genefox.app/r/reference/gf_geo_search.md)
  : Search NCBI GEO for expression series (GSE) as GeneFox's GEO search
  does (smart synonym expansion,...
- [`gf_geo_series_expression()`](https://genefox.app/r/reference/gf_geo_series_expression.md)
  : Open a GEO series (GSE) as GeneFox's GEO Expression screen does and
  report one gene or probe: its...
- [`gf_geo_supplementary_layout()`](https://genefox.app/r/reference/gf_geo_supplementary_layout.md)
  : List a GEO series' supplementary filenames and automatic candidate
  ranks
- [`gf_geo_top_correlates()`](https://genefox.app/r/reference/gf_geo_top_correlates.md)
  : Which probes of a GEO series correlate with one gene or probe,
  genome-wide, as GeneFox's GEO Top...

## cBioPortal

- [`gf_cbioportal_alterations()`](https://genefox.app/r/reference/gf_cbioportal_alterations.md)
  : How often one gene is altered in a curated cBioPortal study, as
  GeneFox's cBioPortal screen reports it:...
- [`gf_cbioportal_composition()`](https://genefox.app/r/reference/gf_cbioportal_composition.md)
  : What one curated cBioPortal study's cohort is made of, measured from
  its own COHORT attribute as GeneFox's...
- [`gf_cbioportal_cross_study_mutations()`](https://genefox.app/r/reference/gf_cbioportal_cross_study_mutations.md)
  : Compare protein-altering mutations in one gene across 1–32 curated
  cBioPortal studies in one portal
- [`gf_cbioportal_expression()`](https://genefox.app/r/reference/gf_cbioportal_expression.md)
  : One gene's mRNA expression in a curated cBioPortal study, one box
  per contributing program (the study's...
- [`gf_cbioportal_mutation_burden()`](https://genefox.app/r/reference/gf_cbioportal_mutation_burden.md)
  : Retrieve a study’s declared sample-level TMB_NONSYNONYMOUS or
  MUTATION_COUNT clinical attribute without...
- [`gf_cbioportal_significantly_mutated_genes()`](https://genefox.app/r/reference/gf_cbioportal_significantly_mutated_genes.md)
  : Retrieve published MutSig significantly mutated genes for a curated
  study, distinct from GISTIC...
- [`gf_cbioportal_structural_variants()`](https://genefox.app/r/reference/gf_cbioportal_structural_variants.md)
  : Analyze structural variants involving either partner of one gene in
  a curated cBioPortal study
- [`gf_cbioportal_studies()`](https://genefox.app/r/reference/gf_cbioportal_studies.md)
  : The cBioPortal studies GeneFox curates for one portal (ccdi, the
  screen's default, or public), as its...
- [`gf_cbioportal_treatment_counts()`](https://genefox.app/r/reference/gf_cbioportal_treatment_counts.md)
  : Retrieve separate patient and sample Agent treatment count reports
  for one curated cBioPortal study

## ArrayExpress

- [`gf_arrayexpress_details()`](https://genefox.app/r/reference/gf_arrayexpress_details.md)
  : An ArrayExpress study's record as GeneFox's source reads it: title,
  organism, platform, sample count,...
- [`gf_arrayexpress_expression()`](https://genefox.app/r/reference/gf_arrayexpress_expression.md)
  : Load an ArrayExpress study's processed expression matrix (text
  TSV/TSV-like file the study publishes)...
- [`gf_arrayexpress_search()`](https://genefox.app/r/reference/gf_arrayexpress_search.md)
  : Search EMBL-EBI ArrayExpress (BioStudies) for expression studies, as
  GeneFox's ArrayExpress source does,...

## GTEx/HPA reference

- [`gf_gtex_tissue_expression()`](https://genefox.app/r/reference/gf_gtex_tissue_expression.md)
  : Where a gene is expressed across GTEx normal tissues (UCSC TOIL
  recomputation), ranked by median, as...
- [`gf_hpa_gene()`](https://genefox.app/r/reference/gf_hpa_gene.md) :
  Human Protein Atlas expression for one human gene: consensus tissue
  RNA nTPM across 51 tissues,...
- [`gf_reference_ccle_expression()`](https://genefox.app/r/reference/gf_reference_ccle_expression.md)
  : One gene's expression across the CCLE cancer cell lines (Treehouse
  Cell Line Compendium v1, log2(TPM+1)),...
- [`gf_reference_expression_atlas()`](https://genefox.app/r/reference/gf_reference_expression_atlas.md)
  : One gene's median TPM across the assay groups (tissues, cell types)
  of an EMBL-EBI Expression Atlas...
- [`gf_reference_expression_atlas_catalog()`](https://genefox.app/r/reference/gf_reference_expression_atlas_catalog.md)
  : The Expression Atlas experiments GeneFox's Reference › Expression
  Atlas picker offers: its three curated...
- [`gf_reference_treehouse_expression()`](https://genefox.app/r/reference/gf_reference_treehouse_expression.md)
  : One gene's expression in the independent-source pediatric and rare
  tumors of the UCSC Treehouse Tumor...

## Survival

- [`gf_geo_survival()`](https://genefox.app/r/reference/gf_geo_survival.md)
  : Kaplan-Meier survival from a GEO series' own sample metadata, as
  GeneFox's GEO Survival section computes...
- [`gf_tcga_pan_cancer_survival()`](https://genefox.app/r/reference/gf_tcga_pan_cancer_survival.md)
  : Is one gene's expression associated with overall survival in each
  TCGA cancer?
- [`gf_tcga_survival()`](https://genefox.app/r/reference/gf_tcga_survival.md)
  : Survival of a TCGA/GDC project's patients (Kaplan-Meier; eligible
  two-group log-rank, Cox HR for...

## Differential expression

- [`gf_imported_de_enrichment()`](https://genefox.app/r/reference/gf_imported_de_enrichment.md)
  : Analyze a complete precomputed gene-level DE CSV/TSV against
  validated bundled gene sets, free and locally
- [`gf_tcga_differential_expression()`](https://genefox.app/r/reference/gf_tcga_differential_expression.md)
  : Two-group differential expression on a gene panel in one TCGA or
  other GDC cohort, as GeneFox's...

## PCA/dimensionality

- [`gf_geo_sample_pca()`](https://genefox.app/r/reference/gf_geo_sample_pca.md)
  : Project a GEO series' samples onto PC1 x PC2, as GeneFox's sample
  PCA screen does (top 2,000 most variable...
- [`gf_tcga_sample_pca()`](https://genefox.app/r/reference/gf_tcga_sample_pca.md)
  : Project every sample of a TCGA/GDC cohort onto PC1 x PC2 over the
  2,000 most variable genes of the whole...

## Figures and recipes

- [`gf_geo_heatmap()`](https://genefox.app/r/reference/gf_geo_heatmap.md)
  : Draw a free public GEO heatmap from a whole series matrix
- [`gf_open_destination()`](https://genefox.app/r/reference/gf_open_destination.md)
  : Open a GeneFox link (genefox://…) or a saved-view descriptor as the
  app would: returns where it goes...
- [`gf_tcga_heatmap()`](https://genefox.app/r/reference/gf_tcga_heatmap.md)
  : An expression heatmap of a gene panel across one TCGA or other GDC
  cohort, as GeneFox's Heatmap screen...

## Gene and utilities

- [`gf_gene_info()`](https://genefox.app/r/reference/gf_gene_info.md) :
  NCBI Gene metadata for one gene, as GeneFox's gene-info card shows it:
  official symbol, Entrez ID, full...
- [`gf_list_coverage()`](https://genefox.app/r/reference/gf_list_coverage.md)
  : List GeneFox's free app operations and, for each, the tool that
  reaches it (or null), whether it is...
- [`gf_list_operations()`](https://genefox.app/r/reference/gf_list_operations.md)
  : List every analysis GeneFox can perform, as the operation id,
  display name, summary and data scope...
- [`gf_list_signature_presets()`](https://genefox.app/r/reference/gf_list_signature_presets.md)
  : List GeneFox's bundled signature presets in app order, with exact
  names, gene counts, descriptions,...
- [`gf_toxicodb_analysis()`](https://genefox.app/r/reference/gf_toxicodb_analysis.md)
  : ToxicoDB's own precomputed differential-expression results (limma;
  fold change, p-value and FDR exactly as...
- [`gf_toxicodb_experiments()`](https://genefox.app/r/reference/gf_toxicodb_experiments.md)
  : One gene's ToxicoDB expression under one compound: every sample by
  dose (Control, Low, Middle, High:...
- [`gf_toxicodb_search()`](https://genefox.app/r/reference/gf_toxicodb_search.md)
  : Find genes or compounds in ToxicoDB (toxicodb.ca: Open TG-GATEs
  human and rat, DrugMatrix rat, EMEXP2458...

## Account and tools

- [`gf_account_status()`](https://genefox.app/r/reference/gf_account_status.md)
  : Report what this GeneFox server can do for your account: whether it
  is linked to a GeneFox account, which...
- [`gf_scientific_tools`](https://genefox.app/r/reference/gf_scientific_tools.md)
  : Generated GeneFox scientific tool clients
- [`gf_session`](https://genefox.app/r/reference/gf_client.md)
  [`gf_close`](https://genefox.app/r/reference/gf_client.md)
  [`gf_call`](https://genefox.app/r/reference/gf_client.md)
  [`gf_tools`](https://genefox.app/r/reference/gf_client.md)
  [`gf_table`](https://genefox.app/r/reference/gf_client.md)
  [`gf_save_figure`](https://genefox.app/r/reference/gf_client.md)
  [`gf_to_tibble`](https://genefox.app/r/reference/gf_client.md)
  [`gf_to_data_table`](https://genefox.app/r/reference/gf_client.md)
  [`gf_from_se`](https://genefox.app/r/reference/gf_client.md)
  [`gf_to_se`](https://genefox.app/r/reference/gf_client.md) : GeneFox
  scientific client and framework adapters
- [`gf_experiment()`](https://genefox.app/r/reference/gf_experiment.md)
  : Construct a Dense Expression Experiment
- [`gf_result_schemas()`](https://genefox.app/r/reference/gf_result_schemas.md)
  : Inspect the versioned GeneFox result contracts
- [`gf_runtime()`](https://genefox.app/r/reference/gf_runtime.md) :
  Validate a Local GeneFox Runtime Bundle
- [`gf_write_import()`](https://genefox.app/r/reference/gf_write_import.md)
  : Write an Explicit Local Expression Input
