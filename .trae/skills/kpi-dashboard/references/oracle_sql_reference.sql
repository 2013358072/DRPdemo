-- ================================================================
-- 绩效考核大屏 Oracle SQL 参考
-- 适配 KPI_EMPLOYEE_RESULT 表结构
-- ================================================================

-- ----------------------------------------------------------------
-- 1. 表结构参考（根据实际情况调整字段名）
-- ----------------------------------------------------------------
/*
KPI_EMPLOYEE_RESULT (员工考核结果表)
CREATE TABLE KPI_EMPLOYEE_RESULT (
    YEAR          VARCHAR2(4)    NOT NULL,  -- 考核年份，如 '2024'
    ACCOUNT       VARCHAR2(50)   NOT NULL,  -- 员工账号
    EMP_NAME      VARCHAR2(100)  NOT NULL,  -- 员工姓名
    DEPT_ID       VARCHAR2(20),             -- 部门ID
    DEPT_NAME     VARCHAR2(100),            -- 部门名称
    JOB_TYPE      VARCHAR2(50),             -- 职位分类（技术/管理/职能/销售/研发）
    JOB_TITLE     VARCHAR2(100),            -- 职位名称
    SCORE         NUMBER(5,1),              -- 考核得分（0~100）
    LEVEL_ID      NUMBER(1),                -- 绩效等级ID（1优秀/2良好/3合格/4基本合格/5不合格）
    LEVEL_NAME    VARCHAR2(20),             -- 绩效等级名称
    STATUS        VARCHAR2(20),             -- 考核状态（已确认/评分中/确认中/重评中/已提交）
    
    -- 主键可以根据业务需求定义，建议使用复合主键
    CONSTRAINT PK_KPI_EMPLOYEE_RESULT PRIMARY KEY (YEAR, ACCOUNT)
);

KPI_DEPT (部门表)
CREATE TABLE KPI_DEPT (
    DEPT_ID        VARCHAR2(20)  NOT NULL,  -- 部门ID（主键）
    DEPT_NAME      VARCHAR2(100) NOT NULL,  -- 部门名称
    PARENT_DEPT_ID VARCHAR2(20),            -- 上级部门ID（根节点为 NULL 或 '0'）
    
    CONSTRAINT PK_KPI_DEPT PRIMARY KEY (DEPT_ID),
    CONSTRAINT FK_KPI_DEPT_PARENT FOREIGN KEY (PARENT_DEPT_ID) 
        REFERENCES KPI_DEPT(DEPT_ID)
);

-- 为提高查询性能，建议添加以下索引
CREATE INDEX IDX_KPI_EMP_YEAR_DEPT ON KPI_EMPLOYEE_RESULT(YEAR, DEPT_ID);
CREATE INDEX IDX_KPI_EMP_STATUS ON KPI_EMPLOYEE_RESULT(STATUS);
CREATE INDEX IDX_KPI_EMP_LEVEL ON KPI_EMPLOYEE_RESULT(LEVEL_ID);
CREATE INDEX IDX_KPI_DEPT_PARENT ON KPI_DEPT(PARENT_DEPT_ID);
*/

-- ----------------------------------------------------------------
-- 2. 递归获取某部门及所有子部门 ID
-- ----------------------------------------------------------------
SELECT DEPT_ID
FROM KPI_DEPT
START WITH DEPT_ID = '0001'          -- 替换为目标部门ID
CONNECT BY PRIOR DEPT_ID = PARENT_DEPT_ID;


-- ----------------------------------------------------------------
-- 3. 概览指标查询（含子部门递归）
-- ----------------------------------------------------------------
SELECT
    COUNT(*)                                                          AS TOTAL,
    COUNT(DISTINCT DEPT_ID)                                           AS DEPTS,
    SUM(CASE WHEN STATUS IN ('已确认','已提交') THEN 1 ELSE 0 END)     AS DONE,
    SUM(CASE WHEN LEVEL_ID = 1 THEN 1 ELSE 0 END)                    AS EXCELLENT,
    SUM(CASE WHEN LEVEL_ID = 5 THEN 1 ELSE 0 END)                    AS UNQUALIFIED
FROM KPI_EMPLOYEE_RESULT
WHERE YEAR = '2024'
  AND DEPT_ID IN (
    SELECT DEPT_ID FROM KPI_DEPT
    START WITH DEPT_ID = '0001'
    CONNECT BY PRIOR DEPT_ID = PARENT_DEPT_ID
  );


-- ----------------------------------------------------------------
-- 4. 职位分类分布
-- ----------------------------------------------------------------
SELECT JOB_TYPE AS NAME, COUNT(*) AS VALUE
FROM KPI_EMPLOYEE_RESULT
WHERE YEAR = '2024'
  AND DEPT_ID IN (
    SELECT DEPT_ID FROM KPI_DEPT
    START WITH DEPT_ID = '0001'
    CONNECT BY PRIOR DEPT_ID = PARENT_DEPT_ID
  )
GROUP BY JOB_TYPE
ORDER BY VALUE DESC;


-- ----------------------------------------------------------------
-- 5. 绩效等级分布
-- ----------------------------------------------------------------
SELECT LEVEL_ID, LEVEL_NAME, COUNT(*) AS VALUE
FROM KPI_EMPLOYEE_RESULT
WHERE YEAR = '2024'
  AND DEPT_ID IN (
    SELECT DEPT_ID FROM KPI_DEPT
    START WITH DEPT_ID = '0001'
    CONNECT BY PRIOR DEPT_ID = PARENT_DEPT_ID
  )
GROUP BY LEVEL_ID, LEVEL_NAME
ORDER BY LEVEL_ID;


-- ----------------------------------------------------------------
-- 6. 考核状态分布
-- ----------------------------------------------------------------
SELECT STATUS AS NAME, COUNT(*) AS VALUE
FROM KPI_EMPLOYEE_RESULT
WHERE YEAR = '2024'
  AND DEPT_ID IN (
    SELECT DEPT_ID FROM KPI_DEPT
    START WITH DEPT_ID = '0001'
    CONNECT BY PRIOR DEPT_ID = PARENT_DEPT_ID
  )
GROUP BY STATUS;


-- ----------------------------------------------------------------
-- 7. 员工明细分页查询（Oracle ROWNUM 分页）
-- ----------------------------------------------------------------
-- 按绩效等级筛选（level_id=1 表示优秀）
-- 第1页，每页10条
SELECT *
FROM (
    SELECT t.*, ROWNUM AS RN
    FROM (
        SELECT
            ACCOUNT, EMP_NAME, DEPT_NAME,
            JOB_TYPE, JOB_TITLE,
            SCORE,
            ROUND(SCORE / 100, 2) AS COEFF,  -- 考核系数
            LEVEL_ID, LEVEL_NAME, STATUS
        FROM KPI_EMPLOYEE_RESULT
        WHERE YEAR = '2024'
          AND DEPT_ID IN (
            SELECT DEPT_ID FROM KPI_DEPT
            START WITH DEPT_ID = '0001'
            CONNECT BY PRIOR DEPT_ID = PARENT_DEPT_ID
          )
          AND LEVEL_ID = 1   -- 可替换为其他条件
        ORDER BY SCORE DESC
    ) t
    WHERE ROWNUM <= 10       -- endRow = pageSize * page
)
WHERE RN > 0;                -- startRow = pageSize * (page - 1)


-- ----------------------------------------------------------------
-- 8. 员工明细分页查询（按考核状态筛选）
-- ----------------------------------------------------------------
SELECT *
FROM (
    SELECT t.*, ROWNUM AS RN
    FROM (
        SELECT ACCOUNT, EMP_NAME, DEPT_NAME, JOB_TYPE, JOB_TITLE,
               SCORE, ROUND(SCORE/100,2) AS COEFF, LEVEL_ID, LEVEL_NAME, STATUS
        FROM KPI_EMPLOYEE_RESULT
        WHERE YEAR = '2024'
          AND DEPT_ID IN (
            SELECT DEPT_ID FROM KPI_DEPT
            START WITH DEPT_ID = '0001'
            CONNECT BY PRIOR DEPT_ID = PARENT_DEPT_ID
          )
          AND STATUS = '评分中'
        ORDER BY SCORE DESC
    ) t
    WHERE ROWNUM <= 20
)
WHERE RN > 10;


-- ----------------------------------------------------------------
-- 9. 部门树查询（构建前端树形结构用）
-- ----------------------------------------------------------------
SELECT DEPT_ID, DEPT_NAME, PARENT_DEPT_ID
FROM KPI_DEPT
ORDER BY DEPT_ID;


-- ----------------------------------------------------------------
-- 10. 叶子部门数量（覆盖部门数 = 没有子部门的最小颗粒部门）
-- ----------------------------------------------------------------
SELECT COUNT(*) AS LEAF_DEPTS
FROM KPI_DEPT d
WHERE NOT EXISTS (
    SELECT 1 FROM KPI_DEPT c WHERE c.PARENT_DEPT_ID = d.DEPT_ID
)
AND d.DEPT_ID IN (
    SELECT DEPT_ID FROM KPI_DEPT
    START WITH DEPT_ID = '0001'
    CONNECT BY PRIOR DEPT_ID = PARENT_DEPT_ID
);
