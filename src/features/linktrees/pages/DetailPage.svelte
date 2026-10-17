<script>
  import { ArrowLeft, ImagePlus, Pencil, Trash2, Plus, ExternalLink, ImageOff, User, Calendar } from "lucide-svelte";
  import ChangeCoverModal from "../modals/ChangeCoverModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import ItemModal from "../modals/ItemModal.svelte";
  import { linkTreesStore } from "../states/linkTreesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { navigate } from "../../../router.js";
  import { formatDate, showConfirmDialog } from "../../../helpers/toolsHelper";
  import { typeLabel, typeClass } from "../labels";

  export let linkTreeId;

  let showCoverModal = false;
  let showEditModal = false;
  let showItemModal = false;
  let selectedItem = null;

  $: profile = $usersStore.profile;
  $: linkTree = $linkTreesStore.linkTree;
  $: isOwner = linkTree && profile ? linkTree.user_id === profile.id : false;
  $: items = linkTree?.items || [];

  // Muat detail saat halaman dibuka dan setiap kali id pada URL berubah.
  $: linkTreesStore.asyncSetLinkTree(linkTreeId);

  $: if ($linkTreesStore.isLinkTree) {
    linkTreesStore.setIsLinkTree(false);
    if (!$linkTreesStore.linkTree) {
      navigate("/");
    }
  }

  $: if ($linkTreesStore.isLinkTreeDelete) {
    linkTreesStore.setIsLinkTreeDelete(false);
    if ($linkTreesStore.isLinkTreeDeleted) {
      linkTreesStore.setIsLinkTreeDeleted(false);
      navigate("/");
    }
  }

  $: if ($linkTreesStore.isItemDelete) {
    linkTreesStore.setIsItemDelete(false);
    if ($linkTreesStore.isItemDeleted) {
      linkTreesStore.setIsItemDeleted(false);
      linkTreesStore.asyncSetLinkTree(linkTreeId);
    }
  }

  function openAddItem() {
    selectedItem = null;
    showItemModal = true;
  }

  function openEditItem(item) {
    selectedItem = item;
    showItemModal = true;
  }

  async function handleDelete() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus link tree ini?");
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsLinkTreeDelete(linkTree.id);
    }
  }

  async function handleDeleteItem(item) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus item tautan ini?");
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsItemDelete(linkTree.id, item.id);
    }
  }
</script>

{#if !profile || !linkTree}
  <div class="flex flex-col items-center justify-center py-20">
    <h1 class="sr-only">Memuat detail link tree...</h1>
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <a
        href="/"
        data-testid="back-to-link-trees-link"
        on:click|preventDefault={() => navigate("/")}
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={18} />
        Kembali ke Semua Link Tree
      </a>

      {#if isOwner}
        <div class="flex items-center gap-2">
          <button
            type="button"
            data-testid="edit-cover-btn"
            on:click={() => (showCoverModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
          >
            <ImagePlus size={16} />
            Ubah Sampul
          </button>
          <button
            type="button"
            data-testid="edit-detail-btn"
            on:click={() => (showEditModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
          >
            <Pencil size={16} />
            Ubah Data
          </button>
          <button
            type="button"
            data-testid="delete-detail-btn"
            on:click={handleDelete}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        </div>
      {/if}
    </div>

    <article class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {#if linkTree.cover}
        <img
          src={linkTree.cover}
          alt={linkTree.title}
          data-testid="link-tree-cover-image"
          class="w-full max-h-72 object-cover bg-slate-100"
        />
      {:else}
        <div
          data-testid="link-tree-cover-placeholder"
          class="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500"
        >
          <ImageOff size={48} />
        </div>
      {/if}

      <div class="p-6 sm:p-8 space-y-4">
        <span
          data-testid="detail-type-badge"
          class={["inline-flex px-3 py-1 rounded-full text-xs font-bold border", typeClass(linkTree.type)]}
        >
          {typeLabel(linkTree.type)}
        </span>

        <h1 data-testid="detail-title" class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {linkTree.title}
        </h1>

        <p data-testid="detail-description" class="text-base text-slate-700 leading-relaxed whitespace-pre-line">
          {linkTree.description || "Tidak ada deskripsi."}
        </p>

        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <span class="inline-flex items-center gap-2">
            <User size={16} />
            <span data-testid="detail-author">{linkTree.author?.name || "Pengguna"}</span>
          </span>
          <span class="inline-flex items-center gap-2">
            <Calendar size={16} />
            <span data-testid="detail-created-at">{formatDate(linkTree.created_at)}</span>
          </span>
        </div>
      </div>
    </article>

    <section class="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-bold text-slate-800">Item Tautan</h2>
        {#if isOwner}
          <button
            type="button"
            data-testid="add-item-btn"
            on:click={openAddItem}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md shadow-sky-600/25 transition-all"
          >
            <Plus size={16} />
            Tambah Item
          </button>
        {/if}
      </div>

      {#if items.length === 0}
        <p data-testid="no-items" class="text-sm text-slate-600 text-center py-4">Belum ada item tautan.</p>
      {:else}
        <ul class="space-y-2">
          {#each items as item (item.id)}
            <li
              data-testid={`item-${item.id}`}
              class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`item-link-${item.id}`}
                class="min-w-0 flex-1 inline-flex items-center gap-2 font-semibold text-slate-800 hover:text-indigo-600"
              >
                <span class="truncate">{item.label || item.title || item.url}</span>
                <ExternalLink size={14} class="shrink-0" />
              </a>
              {#if isOwner}
                <div class="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    data-testid={`edit-item-${item.id}`}
                    aria-label="Ubah item"
                    on:click={() => openEditItem(item)}
                    class="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    data-testid={`delete-item-${item.id}`}
                    aria-label="Hapus item"
                    on:click={() => handleDeleteItem(item)}
                    class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <ChangeCoverModal show={showCoverModal} {linkTree} onClose={() => (showCoverModal = false)} />
    <ChangeModal show={showEditModal} {linkTree} onClose={() => (showEditModal = false)} />
    <ItemModal show={showItemModal} {linkTree} item={selectedItem} onClose={() => (showItemModal = false)} />
  </div>
{/if}
