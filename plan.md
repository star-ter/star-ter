# 상권 사이드바 매출 및 시간대 기능 구현하기

## 요구사항

- 기존의 특정 건물 폴리곤을 클릭 시 상권 지표를 표시하고 있었음(mock 데이터)
- 상권 지표에 매출 정보를 실제 정보로 갱신하고, 상권 정보 사이드바 아래에 추가 정보를 표시
- 사용자가 클릭한 건물 폴리곤이 특정 상권의 영역(폴리곤) 내라면, 상권의 정보를 표시한다.
- 건물 폴리곤이 특정 상권의 영역 밖이라면, 해당하는 행정동의 정보를 표시한다.

## 구현을 위한 제공될 DB 스키마

### sales_commercial 테이블(특정 상권의 정보)

1 STDR*YYQU_CD 기준*년분기*코드
2 TRDAR_SE_CD 상권*구분*코드
3 TRDAR_SE_CD_NM 상권*구분*코드*명
4 TRDAR*CD 상권*코드
5 TRDAR*CD_NM 상권*코드*명
6 SVC_INDUTY_CD 서비스*업종*코드
7 SVC_INDUTY_CD_NM 서비스*업종*코드*명
8 THSMON*SELNG_AMT 당월*매출*금액
9 THSMON_SELNG_CO 당월*매출*건수
10 MDWK_SELNG_AMT 주중*매출*금액
11 WKEND_SELNG_AMT 주말*매출*금액
12 MON_SELNG_AMT 월요일*매출*금액
13 TUES_SELNG_AMT 화요일*매출*금액
14 WED_SELNG_AMT 수요일*매출*금액
15 THUR_SELNG_AMT 목요일*매출*금액
16 FRI_SELNG_AMT 금요일*매출*금액
17 SAT_SELNG_AMT 토요일*매출*금액
18 SUN_SELNG_AMT 일요일*매출*금액
19 TMZON_00_06_SELNG_AMT 시간대\_00~06*매출*금액
20 TMZON_06_11_SELNG_AMT 시간대\_06~11*매출*금액
21 TMZON_11_14_SELNG_AMT 시간대\_11~14*매출*금액
22 TMZON_14_17_SELNG_AMT 시간대\_14~17*매출*금액
23 TMZON_17_21_SELNG_AMT 시간대\_17~21*매출*금액
24 TMZON_21_24_SELNG_AMT 시간대\_21~24*매출*금액
25 ML_SELNG_AMT 남성*매출*금액
26 FML_SELNG_AMT 여성*매출*금액
27 AGRDE_10_SELNG_AMT 연령대\_10*매출*금액
28 AGRDE_20_SELNG_AMT 연령대\_20*매출*금액
29 AGRDE_30_SELNG_AMT 연령대\_30*매출*금액
30 AGRDE_40_SELNG_AMT 연령대\_40*매출*금액
31 AGRDE_50_SELNG_AMT 연령대\_50*매출*금액
32 AGRDE_60_ABOVE_SELNG_AMT 연령대\_60*이상*매출*금액
33 MDWK*SELNG_CO 주중*매출*건수
34 WKEND_SELNG_CO 주말*매출*건수
35 MON_SELNG_CO 월요일*매출*건수
36 TUES_SELNG_CO 화요일*매출*건수
37 WED_SELNG_CO 수요일*매출*건수
38 THUR_SELNG_CO 목요일*매출*건수
39 FRI_SELNG_CO 금요일*매출*건수
40 SAT_SELNG_CO 토요일*매출*건수
41 SUN_SELNG_CO 일요일*매출*건수
42 TMZON_00_06_SELNG_CO 시간대*건수~06*매출*건수
43 TMZON*06_11_SELNG_CO 시간대*건수~11*매출*건수
44 TMZON*11_14_SELNG_CO 시간대*건수~14*매출*건수
45 TMZON*14_17_SELNG_CO 시간대*건수~17*매출*건수
46 TMZON*17_21_SELNG_CO 시간대*건수~21*매출*건수
47 TMZON*21_24_SELNG_CO 시간대*건수~24*매출*건수
48 ML*SELNG_CO 남성*매출*건수
49 FML_SELNG_CO 여성*매출*건수
50 AGRDE_10_SELNG_CO 연령대\_10*매출*건수
51 AGRDE_20_SELNG_CO 연령대\_20*매출*건수
52 AGRDE_30_SELNG_CO 연령대\_30*매출*건수
53 AGRDE_40_SELNG_CO 연령대\_40*매출*건수
54 AGRDE_50_SELNG_CO 연령대\_50*매출*건수
55 AGRDE_60_ABOVE_SELNG_CO 연령대\_60*이상*매출*건수

### seoul_commercial_area_grid 테이블(특정 상권의 위치)

1 TRDAR*SE_CD 상권*구분*코드
2 TRDAR_SE_CD_NM 상권*구분*코드*명
3 TRDAR*CD 상권*코드
4 TRDAR*CD_NM 상권*코드*명
5 XCNTS_VALUE 엑스좌표*값
6 YDNTS*VALUE 와이좌표*값
7 SIGNGU*CD 자치구*코드
8 SIGNGU*CD_NM 자치구*코드*명
9 ADSTRD_CD 행정동*코드
10 ADSTRD*CD_NM 행정동*코드*명
11 RELM_AR 영역*면적

### sales_dong(행정동의 추정 매출)

1 STDR*YYQU_CD 기준*년분기*코드
2 ADSTRD_CD 행정동*코드
3 ADSTRD*CD_NM 행정동*코드*명
4 SVC_INDUTY_CD 서비스*업종*코드
5 SVC_INDUTY_CD_NM 서비스*업종*코드*명
6 THSMON*SELNG_AMT 당월*매출*금액
7 THSMON_SELNG_CO 당월*매출*건수
8 MDWK_SELNG_AMT 주중*매출*금액
9 WKEND_SELNG_AMT 주말*매출*금액
10 MON_SELNG_AMT 월요일*매출*금액
11 TUES_SELNG_AMT 화요일*매출*금액
12 WED_SELNG_AMT 수요일*매출*금액
13 THUR_SELNG_AMT 목요일*매출*금액
14 FRI_SELNG_AMT 금요일*매출*금액
15 SAT_SELNG_AMT 토요일*매출*금액
16 SUN_SELNG_AMT 일요일*매출*금액
17 TMZON_00_06_SELNG_AMT 시간대\_00~06*매출*금액
18 TMZON_06_11_SELNG_AMT 시간대\_06~11*매출*금액
19 TMZON_11_14_SELNG_AMT 시간대\_11~14*매출*금액
20 TMZON_14_17_SELNG_AMT 시간대\_14~17*매출*금액
21 TMZON_17_21_SELNG_AMT 시간대\_17~21*매출*금액
22 TMZON_21_24_SELNG_AMT 시간대\_21~24*매출*금액
23 ML_SELNG_AMT 남성*매출*금액
24 FML_SELNG_AMT 여성*매출*금액
25 AGRDE_10_SELNG_AMT 연령대\_10*매출*금액
26 AGRDE_20_SELNG_AMT 연령대\_20*매출*금액
27 AGRDE_30_SELNG_AMT 연령대\_30*매출*금액
28 AGRDE_40_SELNG_AMT 연령대\_40*매출*금액
29 AGRDE_50_SELNG_AMT 연령대\_50*매출*금액
30 AGRDE_60_ABOVE_SELNG_AMT 연령대\_60*이상*매출*금액
31 MDWK*SELNG_CO 주중*매출*건수
32 WKEND_SELNG_CO 주말*매출*건수
33 MON_SELNG_CO 월요일*매출*건수
34 TUES_SELNG_CO 화요일*매출*건수
35 WED_SELNG_CO 수요일*매출*건수
36 THUR_SELNG_CO 목요일*매출*건수
37 FRI_SELNG_CO 금요일*매출*건수
38 SAT_SELNG_CO 토요일*매출*건수
39 SUN_SELNG_CO 일요일*매출*건수
40 TMZON_00_06_SELNG_CO 시간대*건수~06*매출*건수
41 TMZON*06_11_SELNG_CO 시간대*건수~11*매출*건수
42 TMZON*11_14_SELNG_CO 시간대*건수~14*매출*건수
43 TMZON*14_17_SELNG_CO 시간대*건수~17*매출*건수
44 TMZON*17_21_SELNG_CO 시간대*건수~21*매출*건수
45 TMZON*21_24_SELNG_CO 시간대*건수~24*매출*건수
46 ML*SELNG_CO 남성*매출*건수
47 FML_SELNG_CO 여성*매출*건수
48 AGRDE_10_SELNG_CO 연령대\_10*매출*건수
49 AGRDE_20_SELNG_CO 연령대\_20*매출*건수
50 AGRDE_30_SELNG_CO 연령대\_30*매출*건수
51 AGRDE_40_SELNG_CO 연령대\_40*매출*건수
52 AGRDE_50_SELNG_CO 연령대\_50*매출*건수
53 AGRDE_60_ABOVE_SELNG_CO 연령대\_60*이상*매출*건수

## 1. 상권 추정 매출

- 고객이 특정 건물의 폴리곤을 누르면 사이드바가 뜬다(현재 구현되어 있음)
- 해당 폴리곤이 특정 상권의 폴리곤 안에 있으면, 해당 상권의 매출 그래프가 표시된다.
- 폴리곤 밖에 있으면, 행정동의 매출 그래프를 표시한다.
- 매출 그래프는 1~3개월이 하나의 막대로 1~2년의 매출 흐름이 표시되어야 한다.(추이를 볼 수 있어야 함)

## 2. 시간대별 매출

- 새벽(00~06), 아침(06~11), 점심(11~14), 오후(14~17), 저녁(17~21), 밤(21~24)의 매출 추이를 볼 수 있어야 한다.
- 마찬가지로 막대 그래프이며, 가장 높은 시간대는 다른 색의 막대로 강조되어야 한다.
- 가장 높은 시간대에 대한 코멘트를 남겨야 한다.

## 3. 요일별 매출

- 월 ~ 일요일 별 매출 추이를 볼 수 있어야 한다.
- 마찬가지로 막대 그래프이며, 가장 매출이 높은 요일은 다른 색의 막대로 강조되어야 한다.
- 가장 높은 요일에 대한 코멘트를 그래프의 상단에 남겨야 한다. (ex. 전체 결제 중 21%는 토요일에 결제됐어요!)

## 4. 업종별 매출

- 가장 잘 나가는 업종 5개를 표시해야 한다.
- 마찬가지로 막대 그래프이며, 가장 매출이 높은 업종은 다른 색의 막대로 강조되어야 한다.
- 가장 높은 업종에 대한 코멘트를 그래프의 상단에 남겨야 한다. (ex. 전체 업종 중 요식업에 가장 잘나가요!)

## 5. 성별 및 연령대 결제 매출

- 연령대 성별(10대 ~ 60대)로 매출 추이를 볼 수 있어야 한다.
- 마찬가지로 막대 그래프이며, 각 연령대는 남성 / 여성으로 2개의 막대를 가진다.
- 가장 높은 성별, 연령대에 대한 코멘트를 그래프의 상단에 남겨야 한다. (ex. 전체 결제 중 27%는 남성 30대 고객이 결제했어요!)

## 6. 구현 규칙

- 해당 DB에 테이블에 접근해서 데이터를 가져온 뒤 전처리 후 UI에 표시한다.
- 표시할 UI는 기존의 왼쪽의 상권 정보 사이드바이다.
- 표시할 정보가 늘어났기 떄문에 하나의 페이지에서 표시할 수 없으며 스크롤링으로 표시한다.
