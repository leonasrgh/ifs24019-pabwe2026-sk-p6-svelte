import apiHelper from "../../../helpers/apiHelper";

/*
 * Kontrak API Link Trees (kunci data.link_trees dan data.link_tree beserta items
 * berasal dari ketentuan tugas). Bagian berikut adalah asumsi yang perlu dicocokkan
 * dengan dokumentasi Delcom:
 * - Item memakai path /link-trees/:id/items untuk POST, PUT, dan DELETE.
 * - Isi item dikirim dengan field label dan url. Field title juga dikirim sebagai
 *   padanan label, dan item_id juga dikirim sebagai id, agar kedua kemungkinan
 *   penamaan diterima server.
 */

const linkTreeApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/link-trees`;

  function _url(path) {
    return BASE_URL + path;
  }

  async function _parse(response, fallbackMessage) {
    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  function _json(method, body) {
    return {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
  }

  // GET /link-trees (?is_me=1)
  async function getLinkTrees(isMe = false) {
    const response = await apiHelper.fetchData(_url(isMe ? "/?is_me=1" : "/"), {
      method: "GET",
    });
    const result = await _parse(response, "Gagal mengambil data link tree");
    return result.data?.link_trees || [];
  }

  // GET /link-trees/:id
  async function getLinkTreeById(linkTreeId) {
    const response = await apiHelper.fetchData(_url(`/${linkTreeId}`), { method: "GET" });
    const result = await _parse(response, "Gagal mengambil detail link tree");
    return result.data?.link_tree;
  }

  // POST /link-trees
  async function postLinkTree(title, type, description) {
    const response = await apiHelper.fetchData(_url("/"), _json("POST", { title, type, description }));
    const result = await _parse(response, "Gagal menambahkan link tree");
    return result.data;
  }

  // PUT /link-trees/:id
  async function putLinkTree(linkTreeId, title, type, description) {
    const response = await apiHelper.fetchData(
      _url(`/${linkTreeId}`),
      _json("PUT", { title, type, description })
    );
    const result = await _parse(response, "Gagal mengubah link tree");
    return result.message;
  }

  // POST /link-trees/:id/cover (multipart/form-data)
  async function postLinkTreeCover(linkTreeId, cover) {
    const formData = new FormData();
    formData.append("cover", cover, cover.name || "cover.jpg");
    const response = await apiHelper.fetchData(_url(`/${linkTreeId}/cover`), {
      method: "POST",
      body: formData,
    });
    const result = await _parse(response, "Gagal mengubah cover");
    return result.message;
  }

  // DELETE /link-trees/:id
  async function deleteLinkTree(linkTreeId) {
    const response = await apiHelper.fetchData(_url(`/${linkTreeId}`), { method: "DELETE" });
    const result = await _parse(response, "Gagal menghapus link tree");
    return result.message;
  }

  // DELETE /link-trees (hapus semua milik pengguna)
  async function deleteAllLinkTrees() {
    const response = await apiHelper.fetchData(_url("/"), { method: "DELETE" });
    const result = await _parse(response, "Gagal menghapus semua link tree");
    return result.message;
  }

  // POST /link-trees/:id/items
  async function postItem(linkTreeId, label, url) {
    const response = await apiHelper.fetchData(
      _url(`/${linkTreeId}/items`),
      _json("POST", { label, title: label, url })
    );
    const result = await _parse(response, "Gagal menambahkan item tautan");
    return result.message;
  }

  // PUT /link-trees/:id/items
  async function putItem(linkTreeId, itemId, label, url) {
    const response = await apiHelper.fetchData(
      _url(`/${linkTreeId}/items`),
      _json("PUT", { item_id: itemId, id: itemId, label, title: label, url })
    );
    const result = await _parse(response, "Gagal mengubah item tautan");
    return result.message;
  }

  // DELETE /link-trees/:id/items
  async function deleteItem(linkTreeId, itemId) {
    const response = await apiHelper.fetchData(
      _url(`/${linkTreeId}/items`),
      _json("DELETE", { item_id: itemId, id: itemId })
    );
    const result = await _parse(response, "Gagal menghapus item tautan");
    return result.message;
  }

  return {
    getLinkTrees,
    getLinkTreeById,
    postLinkTree,
    putLinkTree,
    postLinkTreeCover,
    deleteLinkTree,
    deleteAllLinkTrees,
    postItem,
    putItem,
    deleteItem,
  };
})();

export default linkTreeApi;
