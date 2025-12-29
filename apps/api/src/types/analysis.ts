export interface SalesRow {
    STDR_YYQU_CD: string;
    THSMON_SELNG_AMT: bigint;
    MON_SELNG_AMT: bigint;
    TUES_SELNG_AMT: bigint;
    WED_SELNG_AMT: bigint;
    THUR_SELNG_AMT: bigint;
    FRI_SELNG_AMT: bigint;
    SAT_SELNG_AMT: bigint;
    SUN_SELNG_AMT: bigint;
    TMZON_00_06_SELNG_AMT: bigint;
    TMZON_06_11_SELNG_AMT: bigint;
    TMZON_11_14_SELNG_AMT: bigint;
    TMZON_14_17_SELNG_AMT: bigint;
    TMZON_17_21_SELNG_AMT: bigint;
    TMZON_21_24_SELNG_AMT: bigint;
    ML_SELNG_AMT: bigint;
    FML_SELNG_AMT: bigint;
    AGRDE_10_SELNG_AMT: bigint;
    AGRDE_20_SELNG_AMT: bigint;
    AGRDE_30_SELNG_AMT: bigint;
    AGRDE_40_SELNG_AMT: bigint;
    AGRDE_50_SELNG_AMT: bigint;
    AGRDE_60_ABOVE_SELNG_AMT: bigint;
}

export interface StoreRow {
    STOR_CO: number;
    OPBIZ_STOR_CO: number;
    CLSBIZ_STOR_CO: number;
    SVC_INDUTY_CD_NM: string;
    STDR_YYQU_CD: string;
}

export interface PopulationRow {
    TOT_REPOP_CO: number;
    ML_REPOP_CO: number;
    FML_REPOP_CO: number;
    AGRDE_10_REPOP_CO: number;
    AGRDE_20_REPOP_CO: number;
    AGRDE_30_REPOP_CO: number;
    AGRDE_40_REPOP_CO: number;
    AGRDE_50_REPOP_CO: number;
    AGRDE_60_ABOVE_REPOP_CO: number;
    STDR_YYQU_CD: string;
}
