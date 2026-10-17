import { describe, it, expect, vi, beforeEach } from "vitest";
import DetailPage from "./DetailPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import { linkTreesStore } from "../states/linkTreesStore";
import linkTreeApi from "../api/linkTreeApi";
import * as routerModule from "../../../router";
import * as toolsHelper from "../../../helpers/toolsHelper";

vi.mock("../api/linkTreeApi", () => ({
  default: {
    getLinkTrees: vi.fn(),
    getLinkTreeById: vi.fn(),
  },
}));

const TID = (id) => `[data-testid="${id}"]`;
const settle = () => new Promise((r) => setTimeout(r, 25));
const profile = { id: 1, name: "Abdullah", email: "abdul@del.org" };
const base = {
  id: 5,
  user_id: 1,
  title: "Tautan Saya",
  type: "public",
  description: "Semua tautan penting",
  cover: "https://example.com/cover.jpg",
  created_at: "2026-10-05T08:34:04.000000Z",
  author: { name: "Abdullah" },
  items: [
    { id: 11, label: "GitHub", url: "https://github.com/user" },
    { id: 12, title: "Blog", url: "https://blog.id" },
    { id: 13, url: "https://tanpa-label.id" },
  ],
};

async function renderPage(linkTree, preloadedState = { profile }, props = { linkTreeId: "5" }) {
  vi.mocked(linkTreeApi.getLinkTreeById).mockResolvedValue(linkTree);
  const result = renderWithProviders(DetailPage, { route: "/link-trees/5", props, preloadedState });
  await settle();
  return result;
}

describe("DetailPage", () => {
  let navSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    linkTreesStore.reset();
    vi.mocked(linkTreeApi.getLinkTreeById).mockReset();
    navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});
  });

  describe("loading and redirects", () => {
    it("should show a spinner while the link tree is loading", async () => {
      vi.mocked(linkTreeApi.getLinkTreeById).mockReturnValue(new Promise(() => {}));
      const { wrapper } = renderWithProviders(DetailPage, { route: "/link-trees/5", props: { linkTreeId: "5" }, preloadedState: { profile } });
      await settle();
      expect(wrapper.find(".animate-spin").exists()).toBe(true);
      expect(wrapper.find("h1").text()).toBe("Memuat detail link tree...");
    });

    it("should show a spinner when the profile is missing", async () => {
      const { wrapper } = await renderPage(base, { profile: null });
      expect(wrapper.find(".animate-spin").exists()).toBe(true);
    });

    it("should fetch by the id prop and refetch when it changes", async () => {
      const { rerender } = await renderPage(base);
      expect(linkTreeApi.getLinkTreeById).toHaveBeenCalledWith("5");
      await rerender({ linkTreeId: "9" });
      await settle();
      expect(linkTreeApi.getLinkTreeById).toHaveBeenLastCalledWith("9");
    });

    it("should redirect home when the link tree cannot be loaded", async () => {
      vi.mocked(linkTreeApi.getLinkTreeById).mockRejectedValue(new Error("not found"));
      renderWithProviders(DetailPage, { route: "/link-trees/5", props: { linkTreeId: "5" }, preloadedState: { profile } });
      await settle();
      expect(navSpy).toHaveBeenCalledWith("/");
    });

    it("should stay when the link tree is loaded", async () => {
      await renderPage(base);
      expect(navSpy).not.toHaveBeenCalledWith("/");
    });
  });

  describe("content", () => {
    it("should render the details with cover, type badge, author and date", async () => {
      const { wrapper } = await renderPage(base);
      expect(wrapper.find(TID("detail-title")).text().trim()).toBe("Tautan Saya");
      expect(wrapper.find(TID("detail-type-badge")).text().trim()).toBe("Publik");
      expect(wrapper.find(TID("detail-description")).text().trim()).toBe("Semua tautan penting");
      expect(wrapper.find(TID("detail-author")).text()).toBe("Abdullah");
      expect(wrapper.find(TID("detail-created-at")).text()).not.toBe("-");
      expect(wrapper.find(TID("link-tree-cover-image")).attributes("src")).toBe("https://example.com/cover.jpg");
    });

    it("should render a placeholder cover and fallbacks for author, description and items", async () => {
      const { wrapper } = await renderPage({ ...base, cover: null, author: null, description: null, items: undefined });
      expect(wrapper.find(TID("link-tree-cover-placeholder")).exists()).toBe(true);
      expect(wrapper.find(TID("link-tree-cover-image")).exists()).toBe(false);
      expect(wrapper.find(TID("detail-author")).text()).toBe("Pengguna");
      expect(wrapper.find(TID("detail-description")).text().trim()).toBe("Tidak ada deskripsi.");
      expect(wrapper.find(TID("no-items")).exists()).toBe(true);
    });

    it("should list items with label, title or URL as the visible name and safe external links", async () => {
      const { wrapper } = await renderPage(base);
      expect(wrapper.find(TID("item-link-11")).text().trim()).toBe("GitHub");
      expect(wrapper.find(TID("item-link-12")).text().trim()).toBe("Blog");
      expect(wrapper.find(TID("item-link-13")).text().trim()).toBe("https://tanpa-label.id");
      expect(wrapper.find(TID("item-link-11")).attributes("href")).toBe("https://github.com/user");
      expect(wrapper.find(TID("item-link-11")).attributes("target")).toBe("_blank");
      expect(wrapper.find(TID("item-link-11")).attributes("rel")).toBe("noopener noreferrer");
      expect(wrapper.find(TID("no-items")).exists()).toBe(false);
    });

    it("should update the type badge when the link tree changes", async () => {
      const { wrapper } = await renderPage(base);
      expect(wrapper.find(TID("detail-type-badge")).text().trim()).toBe("Publik");

      linkTreesStore.setLinkTree({ ...base, type: "private" });
      await settle();
      expect(wrapper.find(TID("detail-type-badge")).text().trim()).toBe("Privat");
    });

    it("should go back home from the back link", async () => {
      const { wrapper } = await renderPage(base);
      await wrapper.find(TID("back-to-link-trees-link")).trigger("click");
      expect(navSpy).toHaveBeenCalledWith("/");
    });
  });

  describe("roles", () => {
    it("should show owner actions and item management to the owner", async () => {
      const { wrapper } = await renderPage(base);
      expect(wrapper.find(TID("edit-cover-btn")).exists()).toBe(true);
      expect(wrapper.find(TID("edit-detail-btn")).exists()).toBe(true);
      expect(wrapper.find(TID("delete-detail-btn")).exists()).toBe(true);
      expect(wrapper.find(TID("add-item-btn")).exists()).toBe(true);
      expect(wrapper.find(TID("edit-item-11")).exists()).toBe(true);
      expect(wrapper.find(TID("delete-item-11")).exists()).toBe(true);
    });

    it("should hide management actions from other users", async () => {
      const { wrapper } = await renderPage({ ...base, user_id: 99 });
      expect(wrapper.find(TID("edit-cover-btn")).exists()).toBe(false);
      expect(wrapper.find(TID("delete-detail-btn")).exists()).toBe(false);
      expect(wrapper.find(TID("add-item-btn")).exists()).toBe(false);
      expect(wrapper.find(TID("edit-item-11")).exists()).toBe(false);
      expect(wrapper.find(TID("item-link-11")).exists()).toBe(true);
    });
  });

  describe("modals", () => {
    it("should open and close the cover and edit modals", async () => {
      const { wrapper } = await renderPage(base);

      await wrapper.find(TID("edit-cover-btn")).trigger("click");
      await settle();
      expect(wrapper.find(TID("change-cover-modal")).exists()).toBe(true);
      await wrapper.find(TID("close-cover-modal-btn")).trigger("click");
      await settle();
      expect(wrapper.find(TID("change-cover-modal")).exists()).toBe(false);

      await wrapper.find(TID("edit-detail-btn")).trigger("click");
      await settle();
      expect(wrapper.find(TID("edit-link-tree-modal")).exists()).toBe(true);
      await wrapper.find(TID("close-edit-modal-btn")).trigger("click");
      await settle();
      expect(wrapper.find(TID("edit-link-tree-modal")).exists()).toBe(false);
    });

    it("should open the item modal in add mode and in edit mode", async () => {
      const { wrapper } = await renderPage(base);

      await wrapper.find(TID("add-item-btn")).trigger("click");
      await settle();
      expect(wrapper.find(TID("item-modal-title")).text().trim()).toBe("Tambah Item Tautan");
      await wrapper.find(TID("close-item-modal-btn")).trigger("click");
      await settle();
      expect(wrapper.find(TID("item-modal")).exists()).toBe(false);

      await wrapper.find(TID("edit-item-11")).trigger("click");
      await settle();
      expect(wrapper.find(TID("item-modal-title")).text().trim()).toBe("Ubah Item Tautan");
      expect(wrapper.find(TID("item-label-input")).element.value).toBe("GitHub");
    });
  });

  describe("delete", () => {
    it("should delete the link tree after confirmation only", async () => {
      const confirm = vi.spyOn(toolsHelper, "showConfirmDialog");
      const del = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeDelete").mockImplementation(() => {});
      const { wrapper } = await renderPage(base);

      confirm.mockResolvedValueOnce({ isConfirmed: false });
      await wrapper.find(TID("delete-detail-btn")).trigger("click");
      await settle();
      expect(del).not.toHaveBeenCalled();

      confirm.mockResolvedValueOnce({ isConfirmed: true });
      await wrapper.find(TID("delete-detail-btn")).trigger("click");
      await settle();
      expect(del).toHaveBeenCalledWith(5);
    });

    it("should go home after deletion and stay when deletion failed", async () => {
      await renderPage(base);

      linkTreesStore.setIsLinkTreeDeleted(false);
      linkTreesStore.setIsLinkTreeDelete(true);
      await settle();
      expect(navSpy).not.toHaveBeenCalledWith("/");

      linkTreesStore.setIsLinkTreeDeleted(true);
      linkTreesStore.setIsLinkTreeDelete(true);
      await settle();
      expect(navSpy).toHaveBeenCalledWith("/");
      expect(linkTreesStore.isLinkTreeDeleted).toBe(false);
    });

    it("should delete an item after confirmation only", async () => {
      const confirm = vi.spyOn(toolsHelper, "showConfirmDialog");
      const del = vi.spyOn(linkTreesStore, "asyncSetIsItemDelete").mockImplementation(() => {});
      const { wrapper } = await renderPage(base);

      confirm.mockResolvedValueOnce({ isConfirmed: false });
      await wrapper.find(TID("delete-item-12")).trigger("click");
      await settle();
      expect(del).not.toHaveBeenCalled();

      confirm.mockResolvedValueOnce({ isConfirmed: true });
      await wrapper.find(TID("delete-item-12")).trigger("click");
      await settle();
      expect(del).toHaveBeenCalledWith(5, 12);
    });

    it("should refresh after an item was deleted and not when deletion failed", async () => {
      await renderPage(base);
      const base_calls = vi.mocked(linkTreeApi.getLinkTreeById).mock.calls.length;

      linkTreesStore.setIsItemDeleted(false);
      linkTreesStore.setIsItemDelete(true);
      await settle();
      expect(vi.mocked(linkTreeApi.getLinkTreeById).mock.calls.length).toBe(base_calls);

      linkTreesStore.setIsItemDeleted(true);
      linkTreesStore.setIsItemDelete(true);
      await settle();
      expect(vi.mocked(linkTreeApi.getLinkTreeById).mock.calls.length).toBe(base_calls + 1);
      expect(linkTreesStore.isItemDeleted).toBe(false);
    });
  });
});
