import { describe, it, expect, vi, beforeEach } from "vitest";
import linkTreeApi from "./linkTreeApi";
import apiHelper from "../../../helpers/apiHelper";

function mockResponse(body) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
    json: async () => body,
  });
}

describe("linkTreeApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getLinkTrees", () => {
    it("should fetch all link trees by default and own ones with is_me=1", async () => {
      const spy = mockResponse({ status: "success", data: { link_trees: [{ id: 1 }] } });
      expect(await linkTreeApi.getLinkTrees()).toEqual([{ id: 1 }]);
      expect(spy).toHaveBeenCalledWith(expect.stringMatching(/\/link-trees\/$/), { method: "GET" });

      await linkTreeApi.getLinkTrees(true);
      expect(spy.mock.calls[1][0]).toMatch(/\/link-trees\/\?is_me=1$/);
    });

    it("should return an empty array without data, accept the success flag and throw on failure", async () => {
      mockResponse({ status: "success" });
      expect(await linkTreeApi.getLinkTrees()).toEqual([]);

      mockResponse({ success: true, data: { link_trees: [{ id: 2 }] } });
      expect(await linkTreeApi.getLinkTrees()).toEqual([{ id: 2 }]);

      mockResponse({ status: "fail", message: "Unauthenticated." });
      await expect(linkTreeApi.getLinkTrees()).rejects.toThrow("Unauthenticated.");
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.getLinkTrees()).rejects.toThrow("Gagal mengambil data link tree");
    });
  });

  it("getLinkTreeById should return the detail, undefined without data, and throw on failure", async () => {
    const spy = mockResponse({ status: "success", data: { link_tree: { id: 9, items: [] } } });
    expect(await linkTreeApi.getLinkTreeById(9)).toEqual({ id: 9, items: [] });
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/\/link-trees\/9$/), { method: "GET" });

    mockResponse({ status: "success" });
    expect(await linkTreeApi.getLinkTreeById(9)).toBeUndefined();

    mockResponse({ status: "fail" });
    await expect(linkTreeApi.getLinkTreeById(9)).rejects.toThrow("Gagal mengambil detail link tree");
  });

  it("postLinkTree should send title, type and description", async () => {
    const spy = mockResponse({ status: "success", data: { link_tree_id: 3 } });
    expect(await linkTreeApi.postLinkTree("Profil", "public", "Deskripsi")).toEqual({ link_tree_id: 3 });
    expect(spy.mock.calls[0][0]).toMatch(/\/link-trees\/$/);
    expect(spy.mock.calls[0][1].method).toBe("POST");
    expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({ title: "Profil", type: "public", description: "Deskripsi" });

    mockResponse({ status: "fail", message: "Data tidak valid" });
    await expect(linkTreeApi.postLinkTree("", "", "")).rejects.toThrow("Data tidak valid");
    mockResponse({ status: "fail" });
    await expect(linkTreeApi.postLinkTree("", "", "")).rejects.toThrow("Gagal menambahkan link tree");
  });

  it("putLinkTree should update and return the message", async () => {
    const spy = mockResponse({ status: "success", message: "Berhasil mengubah data" });
    expect(await linkTreeApi.putLinkTree(4, "T", "private", "D")).toBe("Berhasil mengubah data");
    expect(spy.mock.calls[0][0]).toMatch(/\/link-trees\/4$/);
    expect(spy.mock.calls[0][1].method).toBe("PUT");
    expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({ title: "T", type: "private", description: "D" });

    mockResponse({ status: "fail" });
    await expect(linkTreeApi.putLinkTree(4, "", "", "")).rejects.toThrow("Gagal mengubah link tree");
  });

  it("postLinkTreeCover should upload FormData with a default filename", async () => {
    const spy = mockResponse({ status: "success", message: "Berhasil mengubah cover" });
    expect(await linkTreeApi.postLinkTreeCover(1, new File(["x"], "cover.jpg", { type: "image/jpeg" }))).toBe(
      "Berhasil mengubah cover"
    );
    expect(spy.mock.calls[0][0]).toMatch(/\/link-trees\/1\/cover$/);
    expect(spy.mock.calls[0][1].body.get("cover")).toBeInstanceOf(File);

    await linkTreeApi.postLinkTreeCover(2, new Blob(["x"], { type: "image/png" }));
    expect(spy.mock.calls[1][1].body.get("cover").name).toBe("cover.jpg");

    mockResponse({ status: "fail" });
    await expect(linkTreeApi.postLinkTreeCover(1, new File(["x"], "c.png"))).rejects.toThrow("Gagal mengubah cover");
  });

  it("deleteLinkTree and deleteAllLinkTrees should call the right endpoints", async () => {
    const spy = mockResponse({ status: "success", message: "ok" });
    expect(await linkTreeApi.deleteLinkTree(5)).toBe("ok");
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/\/link-trees\/5$/), { method: "DELETE" });
    expect(await linkTreeApi.deleteAllLinkTrees()).toBe("ok");
    expect(spy).toHaveBeenLastCalledWith(expect.stringMatching(/\/link-trees\/$/), { method: "DELETE" });

    mockResponse({ status: "fail" });
    await expect(linkTreeApi.deleteLinkTree(5)).rejects.toThrow("Gagal menghapus link tree");
    await expect(linkTreeApi.deleteAllLinkTrees()).rejects.toThrow("Gagal menghapus semua link tree");
  });

  describe("items", () => {
    it("postItem should send label (with title alias) and url", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menambahkan item" });
      expect(await linkTreeApi.postItem(7, "GitHub", "https://github.com")).toBe("Berhasil menambahkan item");
      expect(spy.mock.calls[0][0]).toMatch(/\/link-trees\/7\/items$/);
      expect(spy.mock.calls[0][1].method).toBe("POST");
      expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({
        label: "GitHub", title: "GitHub", url: "https://github.com",
      });

      mockResponse({ status: "fail" });
      await expect(linkTreeApi.postItem(7, "", "")).rejects.toThrow("Gagal menambahkan item tautan");
    });

    it("putItem should send the item id (with id alias), label and url", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil mengubah item" });
      expect(await linkTreeApi.putItem(7, 3, "Baru", "https://baru.id")).toBe("Berhasil mengubah item");
      expect(spy.mock.calls[0][0]).toMatch(/\/link-trees\/7\/items$/);
      expect(spy.mock.calls[0][1].method).toBe("PUT");
      expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({
        item_id: 3, id: 3, label: "Baru", title: "Baru", url: "https://baru.id",
      });

      mockResponse({ status: "fail" });
      await expect(linkTreeApi.putItem(7, 3, "", "")).rejects.toThrow("Gagal mengubah item tautan");
    });

    it("deleteItem should send the item id in the body", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus item" });
      expect(await linkTreeApi.deleteItem(7, 3)).toBe("Berhasil menghapus item");
      expect(spy.mock.calls[0][0]).toMatch(/\/link-trees\/7\/items$/);
      expect(spy.mock.calls[0][1].method).toBe("DELETE");
      expect(JSON.parse(spy.mock.calls[0][1].body)).toEqual({ item_id: 3, id: 3 });

      mockResponse({ status: "fail" });
      await expect(linkTreeApi.deleteItem(7, 3)).rejects.toThrow("Gagal menghapus item tautan");
    });
  });
});
