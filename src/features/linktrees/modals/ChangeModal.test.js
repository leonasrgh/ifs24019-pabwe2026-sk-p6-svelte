import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import { linkTreesStore } from "../states/linkTreesStore";
import * as toolsHelper from "../../../helpers/toolsHelper";

const TID = (id) => `[data-testid="${id}"]`;
const tick = () => new Promise((r) => setTimeout(r, 10));
const item = { id: 5, title: "Tautan Saya", type: "unlisted", description: "Kumpulan tautan" };

describe("ChangeModal", () => {
  let errorSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({}));
  });

  it("should not render when hidden or without a link tree", () => {
    expect(renderWithProviders(ChangeModal, { props: { show: false, linkTree: item } }).wrapper.find(TID("edit-link-tree-modal")).exists()).toBe(false);
    expect(renderWithProviders(ChangeModal, { props: { show: true, linkTree: null } }).wrapper.find(TID("edit-link-tree-modal")).exists()).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should prefill every field from the link tree", () => {
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, linkTree: item } });
    expect(wrapper.find(TID("edit-link-tree-title-input")).element.value).toBe("Tautan Saya");
    expect(wrapper.find(TID("edit-link-tree-type-select")).element.value).toBe("unlisted");
    expect(wrapper.find(TID("edit-link-tree-description-input")).element.value).toBe("Kumpulan tautan");
  });

  it("should fall back to defaults for missing title, type and description", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTree: { id: 1, title: null, type: null, description: null } },
    });
    expect(wrapper.find(TID("edit-link-tree-title-input")).element.value).toBe("");
    expect(wrapper.find(TID("edit-link-tree-type-select")).element.value).toBe("public");
    expect(wrapper.find(TID("edit-link-tree-description-input")).element.value).toBe("");
  });

  it("should validate title and description", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, linkTree: item } });

    await wrapper.find(TID("edit-link-tree-title-input")).setValue("  ");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("Judul tidak boleh kosong");

    await wrapper.find(TID("edit-link-tree-title-input")).setValue("Judul");
    await wrapper.find(TID("edit-link-tree-description-input")).setValue(" ");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should submit edited values and show loading", async () => {
    const changeSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeChange").mockImplementation(() => {});
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, linkTree: item } });

    await wrapper.find(TID("edit-link-tree-title-input")).setValue(" Baru ");
    await wrapper.find(TID("edit-link-tree-type-select")).setValue("private");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(changeSpy).toHaveBeenCalledWith(5, "Baru", "private", "Kumpulan tautan");
    expect(wrapper.text()).toContain("Menyimpan...");
  });

  it("should refresh the detail and close when change succeeded, and stay open on failure", async () => {
    const refresh = vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockImplementation(() => {});
    const onClose = vi.fn();
    renderWithProviders(ChangeModal, { props: { show: true, linkTree: item, onClose } });

    linkTreesStore.setIsLinkTreeChanged(false);
    linkTreesStore.setIsLinkTreeChange(true);
    await tick();
    expect(onClose).not.toHaveBeenCalled();

    linkTreesStore.setIsLinkTreeChanged(true);
    linkTreesStore.setIsLinkTreeChange(true);
    await tick();
    expect(refresh).toHaveBeenCalledWith(5);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(linkTreesStore.isLinkTreeChanged).toBe(false);
  });

  it("should close without an onClose callback and call it from the close and cancel buttons", async () => {
    vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockImplementation(() => {});
    const noCallback = renderWithProviders(ChangeModal, { props: { show: true, linkTree: item } });
    linkTreesStore.setIsLinkTreeChanged(true);
    linkTreesStore.setIsLinkTreeChange(true);
    await tick();
    expect(linkTreesStore.isLinkTreeChange).toBe(false);
    noCallback.unmount();

    const onClose = vi.fn();
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, linkTree: item, onClose } });
    await wrapper.find(TID("close-edit-modal-btn")).trigger("click");
    await wrapper.find(TID("cancel-edit-modal-btn")).trigger("click");
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
