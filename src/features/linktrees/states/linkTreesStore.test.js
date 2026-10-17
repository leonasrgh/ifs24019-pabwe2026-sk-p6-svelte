import { describe, it, expect, vi, beforeEach } from "vitest";
import { linkTreesStore } from "./linkTreesStore";
import linkTreeApi from "../api/linkTreeApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

const silent = () => Promise.resolve({});

describe("linkTreesStore", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    linkTreesStore.reset();
  });

  it("should have the expected initial state and getters", () => {
    expect(linkTreesStore.linkTrees).toEqual([]);
    expect(linkTreesStore.linkTree).toBeNull();
    expect(linkTreesStore.isLinkTree).toBe(false);
    expect(linkTreesStore.query).toEqual({ isMe: false });
    [
      "isLinkTreeAdd", "isLinkTreeAdded", "isLinkTreeChange", "isLinkTreeChanged",
      "isLinkTreeChangeCover", "isLinkTreeChangedCover", "isLinkTreeDelete", "isLinkTreeDeleted",
      "isLinkTreeDeleteAll", "isLinkTreeDeletedAll", "isItemAdd", "isItemAdded",
      "isItemChange", "isItemChanged", "isItemDelete", "isItemDeleted",
    ].forEach((key) => {
      expect(linkTreesStore[key]).toBe(false);
      expect(linkTreesStore.$state[key]).toBe(false);
    });
  });

  it("reset should restore the initial state and accept a partial state", () => {
    linkTreesStore.setLinkTrees([{ id: 1 }]);
    linkTreesStore.reset();
    expect(linkTreesStore.linkTrees).toEqual([]);
    linkTreesStore.reset({ linkTree: { id: 2 } });
    expect(linkTreesStore.linkTree).toEqual({ id: 2 });
  });

  it("should set list, detail, flag and query", () => {
    linkTreesStore.setLinkTrees([{ id: 1 }]);
    linkTreesStore.setLinkTree({ id: 2 });
    linkTreesStore.setIsLinkTree(true);
    linkTreesStore.setQuery({ isMe: true });
    expect(linkTreesStore.linkTrees).toEqual([{ id: 1 }]);
    expect(linkTreesStore.linkTree).toEqual({ id: 2 });
    expect(linkTreesStore.isLinkTree).toBe(true);
    expect(linkTreesStore.query).toEqual({ isMe: true });
  });

  it.each([
    ["setIsLinkTreeAdd", "isLinkTreeAdd"],
    ["setIsLinkTreeAdded", "isLinkTreeAdded"],
    ["setIsLinkTreeChange", "isLinkTreeChange"],
    ["setIsLinkTreeChanged", "isLinkTreeChanged"],
    ["setIsLinkTreeChangeCover", "isLinkTreeChangeCover"],
    ["setIsLinkTreeChangedCover", "isLinkTreeChangedCover"],
    ["setIsLinkTreeDelete", "isLinkTreeDelete"],
    ["setIsLinkTreeDeleted", "isLinkTreeDeleted"],
    ["setIsLinkTreeDeleteAll", "isLinkTreeDeleteAll"],
    ["setIsLinkTreeDeletedAll", "isLinkTreeDeletedAll"],
    ["setIsItemAdd", "isItemAdd"],
    ["setIsItemAdded", "isItemAdded"],
    ["setIsItemChange", "isItemChange"],
    ["setIsItemChanged", "isItemChanged"],
    ["setIsItemDelete", "isItemDelete"],
    ["setIsItemDeleted", "isItemDeleted"],
  ])("%s should set %s", (setter, key) => {
    linkTreesStore[setter](true);
    expect(linkTreesStore[key]).toBe(true);
    linkTreesStore[setter](false);
    expect(linkTreesStore[key]).toBe(false);
  });

  describe("asyncSetLinkTrees", () => {
    it("should load the list and remember the scope", async () => {
      const spy = vi.spyOn(linkTreeApi, "getLinkTrees").mockResolvedValue([{ id: 1 }]);
      await linkTreesStore.asyncSetLinkTrees(true);
      expect(spy).toHaveBeenCalledWith(true);
      expect(linkTreesStore.linkTrees).toEqual([{ id: 1 }]);
      expect(linkTreesStore.query).toEqual({ isMe: true });
    });

    it("should default to all link trees and fall back to an empty list on failure", async () => {
      const spy = vi.spyOn(linkTreeApi, "getLinkTrees").mockRejectedValue(new Error("fail"));
      linkTreesStore.setLinkTrees([{ id: 1 }]);
      await linkTreesStore.asyncSetLinkTrees();
      expect(spy).toHaveBeenCalledWith(false);
      expect(linkTreesStore.linkTrees).toEqual([]);
    });

    it("asyncReloadLinkTrees should reuse the last scope", async () => {
      const spy = vi.spyOn(linkTreeApi, "getLinkTrees").mockResolvedValue([]);
      await linkTreesStore.asyncSetLinkTrees(true);
      await linkTreesStore.asyncReloadLinkTrees();
      expect(spy).toHaveBeenLastCalledWith(true);
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe("asyncSetLinkTree", () => {
    it("should load the detail and flag isLinkTree", async () => {
      vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue({ id: 7 });
      await linkTreesStore.asyncSetLinkTree(7);
      expect(linkTreesStore.linkTree).toEqual({ id: 7 });
      expect(linkTreesStore.isLinkTree).toBe(true);
    });

    it("should set null when the API returns nothing or fails", async () => {
      const spy = vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(undefined);
      linkTreesStore.setLinkTree({ id: 1 });
      await linkTreesStore.asyncSetLinkTree(7);
      expect(linkTreesStore.linkTree).toBeNull();

      spy.mockRejectedValue(new Error("fail"));
      linkTreesStore.setLinkTree({ id: 1 });
      await linkTreesStore.asyncSetLinkTree(7);
      expect(linkTreesStore.linkTree).toBeNull();
      expect(linkTreesStore.isLinkTree).toBe(true);
    });
  });

  describe("asyncSetIsLinkTreeAdd", () => {
    it("should show the success dialog and flag added", async () => {
      const spy = vi.spyOn(linkTreeApi, "postLinkTree").mockResolvedValue({ link_tree_id: 1 });
      const success = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(silent);
      await linkTreesStore.asyncSetIsLinkTreeAdd("T", "public", "D");
      expect(spy).toHaveBeenCalledWith("T", "public", "D");
      expect(success).toHaveBeenCalledWith("Link tree berhasil ditambahkan!");
      expect(linkTreesStore.isLinkTreeAdded).toBe(true);
      expect(linkTreesStore.isLinkTreeAdd).toBe(true);
    });

    it("should show the error dialog and flag not added on failure", async () => {
      vi.spyOn(linkTreeApi, "postLinkTree").mockRejectedValue(new Error("Data tidak valid"));
      const error = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(silent);
      await linkTreesStore.asyncSetIsLinkTreeAdd("", "", "");
      expect(error).toHaveBeenCalledWith("Data tidak valid");
      expect(linkTreesStore.isLinkTreeAdded).toBe(false);
      expect(linkTreesStore.isLinkTreeAdd).toBe(true);
    });
  });

  describe.each([
    ["asyncSetIsLinkTreeChange", "putLinkTree", [1, "T", "public", "D"], "Link tree berhasil diperbarui!", "isLinkTreeChanged", "isLinkTreeChange"],
    ["asyncSetIsLinkTreeChangeCover", "postLinkTreeCover", [1, new File(["x"], "c.jpg")], "Cover berhasil diperbarui!", "isLinkTreeChangedCover", "isLinkTreeChangeCover"],
    ["asyncSetIsLinkTreeDelete", "deleteLinkTree", [1], "Link tree berhasil dihapus!", "isLinkTreeDeleted", "isLinkTreeDelete"],
    ["asyncSetIsLinkTreeDeleteAll", "deleteAllLinkTrees", [], "Semua link tree berhasil dihapus!", "isLinkTreeDeletedAll", "isLinkTreeDeleteAll"],
    ["asyncSetIsItemAdd", "postItem", [1, "GitHub", "https://github.com"], "Item tautan berhasil ditambahkan!", "isItemAdded", "isItemAdd"],
    ["asyncSetIsItemChange", "putItem", [1, 2, "GitHub", "https://github.com"], "Item tautan berhasil diperbarui!", "isItemChanged", "isItemChange"],
    ["asyncSetIsItemDelete", "deleteItem", [1, 2], "Item tautan berhasil dihapus!", "isItemDeleted", "isItemDelete"],
  ])("%s", (action, apiFn, args, defaultMessage, doneKey, finishKey) => {
    it("should show the API message and flag done on success", async () => {
      vi.spyOn(linkTreeApi, apiFn).mockResolvedValue("Pesan API");
      const success = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(silent);
      await linkTreesStore[action](...args);
      expect(success).toHaveBeenCalledWith("Pesan API");
      expect(linkTreesStore[doneKey]).toBe(true);
      expect(linkTreesStore[finishKey]).toBe(true);
    });

    it("should use the default message when the API message is empty", async () => {
      vi.spyOn(linkTreeApi, apiFn).mockResolvedValue(undefined);
      const success = vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(silent);
      await linkTreesStore[action](...args);
      expect(success).toHaveBeenCalledWith(defaultMessage);
    });

    it("should show the error dialog and flag failure when the request fails", async () => {
      vi.spyOn(linkTreeApi, apiFn).mockRejectedValue(new Error("Gagal"));
      const error = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(silent);
      await linkTreesStore[action](...args);
      expect(error).toHaveBeenCalledWith("Gagal");
      expect(linkTreesStore[doneKey]).toBe(false);
      expect(linkTreesStore[finishKey]).toBe(true);
    });
  });
});
