# 数据逻辑规范

## 指标计算

| 指标 | 计算公式 |
|------|---------|
| 考核总人数 | 当前部门（含子部门）下的员工总数 |
| 覆盖部门数 | 当前部门（含子部门）的叶子节点数 |
| 已完成评分人数 | status IN ('已确认', '已提交') 的人数 |
| 评分完成率 | 已完成评分人数 / 考核总人数 × 100% |
| 优秀人数 | level_id = 1 的人数 |
| 优秀率 | 优秀人数 / 考核总人数 × 100% |
| 不合格人数 | level_id = 5 的人数 |
| 不合格率 | 不合格人数 / 考核总人数 × 100% |

## 绩效等级映射

| level_id | 等级名称 |
|----------|---------|
| 1 | 优秀 |
| 2 | 良好 |
| 3 | 合格 |
| 4 | 基本合格 |
| 5 | 不合格 |

## 考核状态列表

- 已确认、评分中、确认中、重评中、已提交

## REST API 接口（Oracle 模式）

| 接口 | 说明 |
|------|------|
| `GET /api/overview?year=&deptId=` | 概览指标 |
| `GET /api/deptTree` | 部门树 |
| `GET /api/jobDistribution?year=&deptId=` | 职位分类分布 |
| `GET /api/levelDistribution?year=&deptId=` | 绩效等级分布 |
| `GET /api/statusDistribution?year=&deptId=` | 考核状态分布 |
| `GET /api/employeeDetail?year=&deptId=&levelId=&page=&pageSize=` | 员工明细分页 |

> 特殊参数：`/api/employeeDetail` 支持 `statuses` 多值参数（逗号分隔，生成 SQL `IN` 子句），用于如"已确认,已提交"联合查询。
