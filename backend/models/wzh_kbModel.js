/**
 * 姓名：王子涵 | 学号：0807 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
 *
 * 功能名称：wzh_kbModel 本地知识库存储与检索
 * 功能简介：不依赖 MySQL：上传的原始文件落在 backend/uploads/kb/，
 *           分块文本与向量索引落在 backend/data/wzh_kb_index.json；
 *           检索时用余弦相似度找出最相关的若干片段。
 */

const fs = require('fs');
const path = require('path');

var wzh_DATA_DIR = path.join(__dirname, '..', 'data');
var wzh_KB_DIR = path.join(__dirname, '..', 'uploads', 'kb');
var wzh_INDEX_FILE = path.join(wzh_DATA_DIR, 'wzh_kb_index.json');

/**
 * 功能名称：wzh_ensureDirs
 * 功能简介：首次运行时自动创建 data 与 uploads/kb 目录。
 */
function wzh_ensureDirs() {
  if (!fs.existsSync(wzh_DATA_DIR)) {
    fs.mkdirSync(wzh_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(wzh_KB_DIR)) {
    fs.mkdirSync(wzh_KB_DIR, { recursive: true });
  }
}

/**
 * 功能名称：wzh_readIndex
 * 功能简介：读取索引文件；不存在或损坏时返回 { docs: [] }，避免首次上传报错。
 */
function wzh_readIndex() {
  wzh_ensureDirs();
  if (!fs.existsSync(wzh_INDEX_FILE)) {
    return { updatedAt: '', docs: [] };
  }
  try {
    var wzh_json = JSON.parse(fs.readFileSync(wzh_INDEX_FILE, 'utf8'));
    if (!wzh_json || !Array.isArray(wzh_json.docs)) {
      return { updatedAt: '', docs: [] };
    }
    return wzh_json;
  } catch (wzh_err) {
    return { updatedAt: '', docs: [] };
  }
}

/**
 * 功能名称：wzh_writeIndex
 * 功能简介：把索引写回 JSON 文件，并更新时间戳。
 */
function wzh_writeIndex(wzh_index) {
  wzh_ensureDirs();
  wzh_index.updatedAt = new Date().toISOString();
  fs.writeFileSync(wzh_INDEX_FILE, JSON.stringify(wzh_index), 'utf8');
}

/**
 * 功能名称：wzh_docMeta
 * 功能简介：只挑文档的展示字段返回给前端，避免把向量数组塞进接口响应。
 */
function wzh_docMeta(wzh_doc) {
  return {
    id: wzh_doc.id,
    name: wzh_doc.name,
    ext: wzh_doc.ext,
    size: wzh_doc.size,
    uploadedAt: wzh_doc.uploadedAt,
    chunkCount: wzh_doc.chunkCount
  };
}

/**
 * 功能名称：wzh_kbList
 * 功能简介：返回知识库文档列表（按上传时间倒序，不含向量）。
 */
function wzh_kbList() {
  var wzh_index = wzh_readIndex();
  return wzh_index.docs.map(wzh_docMeta);
}

/**
 * 功能名称：wzh_kbStats
 * 功能简介：返回文档数与片段数，页面顶部与空状态提示使用。
 */
function wzh_kbStats() {
  var wzh_index = wzh_readIndex();
  var wzh_chunks = 0;
  wzh_index.docs.forEach(function (wzh_doc) {
    wzh_chunks += Array.isArray(wzh_doc.chunks) ? wzh_doc.chunks.length : 0;
  });
  return {
    docCount: wzh_index.docs.length,
    chunkCount: wzh_chunks,
    updatedAt: wzh_index.updatedAt || ''
  };
}

/**
 * 功能名称：wzh_kbSaveDoc
 * 功能简介：保存原始文件到 uploads/kb，并把分块文本与向量写入索引。
 *           入参：name / ext / size / buffer / chunks / vectors（与 chunks 一一对应）。
 */
function wzh_kbSaveDoc(wzh_payload) {
  wzh_ensureDirs();
  var wzh_index = wzh_readIndex();
  var wzh_id = 'kb_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  var wzh_savedFile = wzh_id + (wzh_payload.ext || '.txt');

  fs.writeFileSync(path.join(wzh_KB_DIR, wzh_savedFile), wzh_payload.buffer);

  var wzh_chunks = wzh_payload.chunks.map(function (wzh_text, wzh_i) {
    return {
      index: wzh_i,
      text: wzh_text,
      vector: wzh_payload.vectors[wzh_i]
    };
  });

  var wzh_doc = {
    id: wzh_id,
    name: wzh_payload.name,
    ext: wzh_payload.ext,
    size: wzh_payload.size,
    savedFile: wzh_savedFile,
    uploadedAt: new Date().toISOString(),
    chunkCount: wzh_chunks.length,
    chunks: wzh_chunks
  };

  wzh_index.docs.unshift(wzh_doc);
  wzh_writeIndex(wzh_index);
  return wzh_docMeta(wzh_doc);
}

/**
 * 功能名称：wzh_cosine
 * 功能简介：计算两个向量的余弦相似度；长度不一致或零向量返回 0。
 */
function wzh_cosine(wzh_a, wzh_b) {
  if (!Array.isArray(wzh_a) || !Array.isArray(wzh_b) || wzh_a.length !== wzh_b.length || !wzh_a.length) {
    return 0;
  }
  var wzh_dot = 0;
  var wzh_na = 0;
  var wzh_nb = 0;
  for (var i = 0; i < wzh_a.length; i++) {
    wzh_dot += wzh_a[i] * wzh_b[i];
    wzh_na += wzh_a[i] * wzh_a[i];
    wzh_nb += wzh_b[i] * wzh_b[i];
  }
  if (!wzh_na || !wzh_nb) {
    return 0;
  }
  return wzh_dot / (Math.sqrt(wzh_na) * Math.sqrt(wzh_nb));
}

/**
 * 功能名称：wzh_kbSearch
 * 功能简介：用问题向量遍历全部片段，按余弦相似度倒序返回前 topK 条，
 *           每条带上文档名、片段序号、相似度与原文。
 */
function wzh_kbSearch(wzh_vector, wzh_topK) {
  var wzh_index = wzh_readIndex();
  var wzh_hits = [];

  wzh_index.docs.forEach(function (wzh_doc) {
    (wzh_doc.chunks || []).forEach(function (wzh_chunk) {
      wzh_hits.push({
        docId: wzh_doc.id,
        docName: wzh_doc.name,
        chunkIndex: wzh_chunk.index,
        score: wzh_cosine(wzh_vector, wzh_chunk.vector),
        text: wzh_chunk.text
      });
    });
  });

  wzh_hits.sort(function (wzh_x, wzh_y) {
    return wzh_y.score - wzh_x.score;
  });

  var wzh_n = Math.min(Math.max(Number(wzh_topK) || 4, 1), 10);
  return wzh_hits.slice(0, wzh_n);
}

/**
 * 功能名称：wzh_kbDelete
 * 功能简介：按 id 删除文档：先删索引条目，再删原始文件；
 *           返回是否真的删除成功。
 */
function wzh_kbDelete(wzh_id) {
  var wzh_index = wzh_readIndex();
  var wzh_target = null;
  var wzh_rest = [];

  wzh_index.docs.forEach(function (wzh_doc) {
    if (wzh_doc.id === wzh_id) {
      wzh_target = wzh_doc;
    } else {
      wzh_rest.push(wzh_doc);
    }
  });

  if (!wzh_target) {
    return false;
  }

  wzh_index.docs = wzh_rest;
  wzh_writeIndex(wzh_index);

  var wzh_file = path.join(wzh_KB_DIR, wzh_target.savedFile || '');
  try {
    if (wzh_target.savedFile && fs.existsSync(wzh_file)) {
      fs.unlinkSync(wzh_file);
    }
  } catch (wzh_err) {
    // 原始文件删除失败不影响索引删除，忽略即可
  }
  return true;
}

module.exports = {
  wzh_kbList: wzh_kbList,
  wzh_kbStats: wzh_kbStats,
  wzh_kbSaveDoc: wzh_kbSaveDoc,
  wzh_kbSearch: wzh_kbSearch,
  wzh_kbDelete: wzh_kbDelete
};
