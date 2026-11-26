# 数据库重建脚本（wzh_fullstack）

> 说明：本文件按执行顺序追加记录，仅凭此文件即可在新机器上完整重建数据库。
> 环境：MySQL 5.7，字符集 utf8mb4。

## 2026-11-23 13:26 · 创建数据库

```sql
CREATE DATABASE IF NOT EXISTS wzh_fullstack
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE wzh_fullstack;
```

## 2026-11-23 13:27 · 创建新闻表 wzh_news 并插入 12 条测试数据

```sql
DROP TABLE IF EXISTS wzh_news;

CREATE TABLE wzh_news (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  title        VARCHAR(120)  NOT NULL COMMENT '新闻标题',
  summary      VARCHAR(255)  NOT NULL COMMENT '摘要',
  content      TEXT          NOT NULL COMMENT '正文',
  source       VARCHAR(60)   NOT NULL COMMENT '来源媒体',
  publish_time DATETIME      NOT NULL COMMENT '发布时间',
  cover_img    VARCHAR(255)  DEFAULT NULL COMMENT '封面图路径',
  PRIMARY KEY (id),
  KEY idx_publish_time (publish_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='科技新闻表';

INSERT INTO wzh_news (title, summary, content, source, publish_time, cover_img) VALUES
('国产大模型开源新版本，推理成本再降四成', '新版本在中文长文本理解上继续提升，同时把单次推理成本压低了约 40%。', '该模型团队公布了最新评测结果：在多个中文长文本基准上超过上一代，并开放了模型权重与推理脚本，开发者可在本地或私有云部署。', '新华社', '2026-11-23 09:20:00', '/images/gallery-1.svg'),
('我国首条光子芯片中试线通线', '光子芯片中试线完成设备调试，进入小批量流片阶段。', '光子芯片以光信号代替电信号完成部分计算，功耗更低。中试线通线意味着从实验室走向工程化，后续将面向数据中心互联场景供货。', '人民日报', '2026-11-22 20:05:00', '/images/gallery-2.svg'),
('可重复使用运载火箭完成第十次回收', '同一枚一级火箭第十次成功回收，复用次数刷新国内纪录。', '本次任务将三颗低轨通信卫星送入预定轨道，一级火箭在海面平台精准着陆，箭体结构检查结果良好，将进入下一次复用准备。', '央视新闻', '2026-11-22 15:40:00', '/images/gallery-3.svg'),
('新型钠离子电池量产线投产', '不依赖锂资源的钠离子电池进入量产阶段，主打储能场景。', '首批产品循环寿命超过 6000 次，低温性能优于磷酸铁锂方案，将优先用于电网侧储能与低速电动车，成本预计再降 15%。', '科技日报', '2026-11-21 11:10:00', '/images/gallery-4.svg'),
('量子计算云平台开放 200 比特真机', '面向高校与科研机构开放真机机时申请，支持在线提交线路。', '平台提供图形化线路编辑与结果可视化，单次任务最长运行时间提升到 10 分钟，适合教学演示与小规模算法验证。', '中国科学报', '2026-11-20 18:30:00', '/images/gallery-5.svg'),
('全国一体化算力网新增八个枢纽节点', '算力调度平台上线新节点，跨区域调度时延进一步降低。', '新增节点覆盖西部与中部地区，通过统一调度接口把闲置算力接入平台，中小企业可按需租用，按时长计费。', '经济日报', '2026-11-20 10:00:00', '/images/gallery-6.svg'),
('脑机接口临床试验完成首例居家使用', '受试者在家庭环境中通过脑机接口完成基础文字输入。', '系统采用非植入式电极帽，配合自适应解码算法，受试者经过两周训练后可稳定完成字符选择，团队下一步将优化佩戴舒适度。', '光明日报', '2026-11-19 16:45:00', '/images/gallery-7.svg'),
('城市低空物流航线累计飞行突破十万架次', '无人机配送在多个城市形成常态化航线网络。', '航线主要覆盖医院、园区与偏远社区，平均配送时长缩短至 18 分钟，运营方表示将把夜间航线纳入下一阶段测试。', '中国青年报', '2026-11-19 09:15:00', '/images/gallery-8.svg'),
('医学影像 AI 辅助诊断进入基层医院', '辅助诊断系统在县域医院部署，覆盖肺结节与骨折筛查。', '系统给出可疑区域标注与置信度，最终结论仍由医生签发；试点数据显示阅片时间平均缩短三成。', '健康报', '2026-11-18 14:20:00', '/images/gallery-1.svg'),
('开源操作系统新版本支持全场景协同', '新版本打通手机、平板与车机，跨设备拖拽文件更顺畅。', '版本重点优化了分布式软总线，设备发现速度提升明显，同时开放了部分系统能力接口，方便开发者适配第三方硬件。', 'IT之家', '2026-11-17 19:05:00', '/images/gallery-2.svg'),
('固态电池装车测试里程突破五万公里', '样车在高温与高寒环境下完成长里程测试。', '测试车辆覆盖城市通勤与高速工况，电池包容量保持率仍在 92% 以上，量产时间表取决于成本下降速度。', '第一财经', '2026-11-17 08:40:00', '/images/gallery-3.svg'),
('国产工业软件在航空制造环节规模化应用', '结构设计与仿真软件在多个型号研制中替代进口方案。', '应用覆盖机体结构建模、强度仿真与工艺规划，工程师反馈求解速度与精度满足型号要求，后续将扩展到更多零部件供应商。', '工信微报', '2026-11-16 17:30:00', '/images/gallery-4.svg');
```

## 2026-11-23 13:28 · 创建图文表 wzh_gallery 并插入 8 条测试数据

```sql
DROP TABLE IF EXISTS wzh_gallery;

CREATE TABLE wzh_gallery (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  title       VARCHAR(100) NOT NULL COMMENT '标题',
  description VARCHAR(255) NOT NULL COMMENT '描述',
  img_url     VARCHAR(255) NOT NULL COMMENT '图片地址',
  category    VARCHAR(40)  NOT NULL COMMENT '分类',
  create_time DATETIME     NOT NULL COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图文列表';

INSERT INTO wzh_gallery (title, description, img_url, category, create_time) VALUES
('光子芯片晶圆', '以光互连替代部分电互连，功耗更低，适合数据中心内部高速传输。', '/images/gallery-1.svg', '芯片', '2026-11-23 10:00:00'),
('低轨通信卫星', '面向偏远地区提供宽带接入，与地面 5G 网络形成互补。', '/images/gallery-2.svg', '航天', '2026-11-22 18:20:00'),
('可复用火箭一级', '垂直回收后经检测可再次执行任务，显著降低单位载荷成本。', '/images/gallery-3.svg', '航天', '2026-11-22 09:40:00'),
('钠离子储能电站', '不依赖锂资源，循环寿命长，适合电网侧削峰填谷。', '/images/gallery-4.svg', '能源', '2026-11-21 15:10:00'),
('量子计算真机', '超导量子比特在极低温环境下运行，面向教学与算法验证开放。', '/images/gallery-5.svg', '计算', '2026-11-20 13:25:00'),
('一体化算力调度中心', '把分散的算力资源统一编排，按需分配给中小企业与科研团队。', '/images/gallery-6.svg', '计算', '2026-11-20 08:30:00'),
('非植入式脑机接口', '电极帽采集脑电信号，算法实时解码，帮助受试者完成文字输入。', '/images/gallery-7.svg', '医疗', '2026-11-19 17:00:00'),
('城市低空物流无人机', '在固定航线上自动飞行，把药品与急件送到社区与园区。', '/images/gallery-8.svg', '物流', '2026-11-19 09:45:00');
```

## 2026-11-23 13:28 · 验收查询

```sql
SELECT COUNT(*) AS news_count FROM wzh_news;
SELECT COUNT(*) AS gallery_count FROM wzh_gallery;
SELECT id, title, publish_time FROM wzh_news ORDER BY publish_time DESC LIMIT 3;
```

## 2026-11-23 14:20 · 统一改为 wzh_ 前缀（数据库迁移）

说明：原库 `wy_fullstack` 中的 `wy_news`、`wy_gallery` 已原样复制到新库 `wzh_fullstack` 的 `wzh_news`、`wzh_gallery`（旧库保留作备份，未删除）。之后所有代码、`backend/.env` 的 `DB_NAME` 均指向 `wzh_fullstack`。

```sql
-- 建新库（字符集与旧库一致）
CREATE DATABASE IF NOT EXISTS wzh_fullstack DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci;

-- 复制表结构（含索引）并搬数据，等同于表名去 wy_ 改 wzh_
DROP TABLE IF EXISTS wzh_fullstack.wzh_news;
CREATE TABLE wzh_fullstack.wzh_news LIKE wy_fullstack.wy_news;
INSERT INTO wzh_fullstack.wzh_news SELECT * FROM wy_fullstack.wy_news;

DROP TABLE IF EXISTS wzh_fullstack.wzh_gallery;
CREATE TABLE wzh_fullstack.wzh_gallery LIKE wy_fullstack.wy_gallery;
INSERT INTO wzh_fullstack.wzh_gallery SELECT * FROM wy_fullstack.wy_gallery;

-- 验收
SELECT 'news' AS t, COUNT(*) AS c FROM wzh_fullstack.wzh_news
UNION ALL SELECT 'gallery', COUNT(*) FROM wzh_fullstack.wzh_gallery;
```

