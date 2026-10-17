import { describe, it, expect, vi, beforeEach } from "vitest";
import ItemModal from "./ItemModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import { linkTreesStore } from "../states/linkTreesStore";
import * as toolsHelper from "../../../helpers/toolsHelper";

const TID = (id) => `[data-testid="${id}"]`;
const tick = () => new Promise((r) => setTimeout(r, 10));
const tree = { id: 7, title: "Tautan Saya" };

describe("ItemModal", () => {
  let errorSpy;

  beforeEach(() => {
    vi.restoreAllMocks();
    errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => Promise.resolve({}));
  });

  it("should not render when hidden or without a link tree, and unlock body scroll", () => {
    expect(renderWithProviders(ItemModal, { props: { show: false, linkTree: tree } }).wrapper.find(TID("item-modal")).exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
    expect(renderWithProviders(ItemModal, { props: { show: true, linkTree: null } }).wrapper.find(TID("item-modal")).exists()).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should open in add mode with an empty form", () => {
    const { wrapper } = renderWithProviders(ItemModal, { props: { show: true, linkTree: tree } });
    expect(wrapper.find(TID("item-modal-title")).text().trim()).toBe("Tambah Item Tautan");
    expect(wrapper.find(TID("item-label-input")).element.value).toBe("");
    expect(wrapper.find(TID("item-url-input")).element.value).toBe("");
  });

  it("should open in edit mode prefilled from the item, falling back to title and empty values", () => {
    const edit = renderWithProviders(ItemModal, {
      props: { show: true, linkTree: tree, item: { id: 1, label: "GitHub", url: "https://github.com" } },
    });
    expect(edit.wrapper.find(TID("item-modal-title")).text().trim()).toBe("Ubah Item Tautan");
    expect(edit.wrapper.find(TID("item-label-input")).element.value).toBe("GitHub");
    expect(edit.wrapper.find(TID("item-url-input")).element.value).toBe("https://github.com");
    edit.unmount();

    const titleOnly = renderWithProviders(ItemModal, {
      props: { show: true, linkTree: tree, item: { id: 2, title: "Blog", url: "https://blog.id" } },
    });
    expect(titleOnly.wrapper.find(TID("item-label-input")).element.value).toBe("Blog");
    titleOnly.unmount();

    const empty = renderWithProviders(ItemModal, { props: { show: true, linkTree: tree, item: { id: 3 } } });
    expect(empty.wrapper.find(TID("item-label-input")).element.value).toBe("");
    expect(empty.wrapper.find(TID("item-url-input")).element.value).toBe("");
  });

  it("should validate the label and the URL format", async () => {
    const { wrapper } = renderWithProviders(ItemModal, { props: { show: true, linkTree: tree } });

    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("Label tidak boleh kosong");

    await wrapper.find(TID("item-label-input")).setValue("GitHub");
    await wrapper.find(TID("item-url-input")).setValue("github.com");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenLastCalledWith("URL harus diawali http:// atau https://");
  });

  it("should add an item with trimmed values and show loading", async () => {
    const addSpy = vi.spyOn(linkTreesStore, "asyncSetIsItemAdd").mockImplementation(() => {});
    const { wrapper } = renderWithProviders(ItemModal, { props: { show: true, linkTree: tree } });

    await wrapper.find(TID("item-label-input")).setValue("  GitHub  ");
    await wrapper.find(TID("item-url-input")).setValue("  https://github.com/user  ");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(addSpy).toHaveBeenCalledWith(7, "GitHub", "https://github.com/user");
    expect(wrapper.text()).toContain("Menyimpan...");
  });

  it("should change an item in edit mode", async () => {
    const changeSpy = vi.spyOn(linkTreesStore, "asyncSetIsItemChange").mockImplementation(() => {});
    const { wrapper } = renderWithProviders(ItemModal, {
      props: { show: true, linkTree: tree, item: { id: 4, label: "Lama", url: "https://lama.id" } },
    });

    await wrapper.find(TID("item-label-input")).setValue("Baru");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(changeSpy).toHaveBeenCalledWith(7, 4, "Baru", "https://lama.id");
  });

  it("should refresh the detail and close after a successful add or change", async () => {
    const refresh = vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockImplementation(() => {});
    const onClose = vi.fn();
    renderWithProviders(ItemModal, { props: { show: true, linkTree: tree, onClose } });

    linkTreesStore.setIsItemAdded(true);
    linkTreesStore.setIsItemAdd(true);
    await tick();
    expect(refresh).toHaveBeenCalledWith(7);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(linkTreesStore.isItemAdd).toBe(false);
    expect(linkTreesStore.isItemAdded).toBe(false);

    linkTreesStore.setIsItemChanged(true);
    linkTreesStore.setIsItemChange(true);
    await tick();
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(linkTreesStore.isItemChange).toBe(false);
    expect(linkTreesStore.isItemChanged).toBe(false);
  });

  it("should stay open when add or change finished but failed", async () => {
    vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockImplementation(() => {});
    const onClose = vi.fn();
    const { wrapper } = renderWithProviders(ItemModal, { props: { show: true, linkTree: tree, onClose } });

    linkTreesStore.setIsItemAdded(false);
    linkTreesStore.setIsItemAdd(true);
    linkTreesStore.setIsItemChanged(false);
    linkTreesStore.setIsItemChange(true);
    await tick();
    expect(onClose).not.toHaveBeenCalled();
    expect(wrapper.find(TID("item-modal")).exists()).toBe(true);
  });

  it("should finish a successful add without an onClose callback", async () => {
    const refresh = vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockImplementation(() => {});
    renderWithProviders(ItemModal, { props: { show: true, linkTree: tree } });

    linkTreesStore.setIsItemAdded(true);
    linkTreesStore.setIsItemAdd(true);
    await tick();
    expect(refresh).toHaveBeenCalledWith(7);
    expect(linkTreesStore.isItemAdd).toBe(false);
  });

  it("should call onClose from the close and cancel buttons", async () => {
    const onClose = vi.fn();
    const { wrapper } = renderWithProviders(ItemModal, { props: { show: true, linkTree: tree, onClose } });
    await wrapper.find(TID("close-item-modal-btn")).trigger("click");
    await wrapper.find(TID("cancel-item-modal-btn")).trigger("click");
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
