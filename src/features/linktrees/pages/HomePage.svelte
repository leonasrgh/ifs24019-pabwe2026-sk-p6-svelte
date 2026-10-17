<script>
  import { onDestroy } from "svelte";
  import { Plus, Search, Link2, Trash2, Loader2, ImageOff, Calendar, User } from "lucide-svelte";
  import AddModal from "../modals/AddModal.svelte";
  import { linkTreesStore } from "../states/linkTreesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { navigate } from "../../../router.js";
  import { formatDate, showConfirmDialog } from "../../../helpers/toolsHelper";
  import { typeLabel, typeClass } from "../labels";

  let loading = false;
  let searchQuery = "";
  let scope = "all";
  let showAddModal = false;
  let isMounted = true;

  onDestroy(() => {
    isMounted = false;
  });

  $: profile = $usersStore.profile;
  $: linkTrees = $linkTreesStore.linkTrees;

  function loadLinkTrees(isMe) {
    loading = true;
    return Promise.resolve(linkTreesStore.asyncSetLinkTrees(isMe)).finally(() => {
      if (isMounted) loading = false;
    });
  }

  // Muat ulang setiap kali cakupan (Semua / Milik Saya) berubah.
  $: loadLinkTrees(scope === "mine");

  $: if ($linkTreesStore.isLinkTreeDelete) {
    linkTreesStore.setIsLinkTreeDelete(false);
    if ($linkTreesStore.isLinkTreeDeleted) {
      linkTreesStore.setIsLinkTreeDeleted(false);
      linkTreesStore.asyncReloadLinkTrees();
    }
  }

  $: if ($linkTreesStore.isLinkTreeDeleteAll) {
    linkTreesStore.setIsLinkTreeDeleteAll(false);
    if ($linkTreesStore.isLinkTreeDeletedAll) {
      linkTreesStore.setIsLinkTreeDeletedAll(false);
      linkTreesStore.asyncReloadLinkTrees();
    }
  }

  $: stats = [
    { id: "total", label: "Total Link Tree", value: linkTrees.length },
    { id: "public", label: "Publik", value: linkTrees.filter((i) => i.type === "public").length },
    { id: "unlisted", label: "Unlisted", value: linkTrees.filter((i) => i.type === "unlisted").length },
    { id: "private", label: "Privat", value: linkTrees.filter((i) => i.type === "private").length },
  ];

  $: filtered = linkTrees.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const title = item.title ? item.title.toLowerCase() : "";
    const description = item.description ? item.description.toLowerCase() : "";
    return title.includes(query) || description.includes(query);
  });

  async function handleDelete(linkTreeId) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus link tree ini?");
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsLinkTreeDelete(linkTreeId);
    }
  }

  async function handleDeleteAll() {
    const result = await showConfirmDialog(
      "Apakah Anda yakin ingin menghapus SEMUA link tree milik Anda? Tindakan ini tidak dapat dibatalkan."
    );
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsLinkTreeDeleteAll();
    }
  }
</script>

{#if profile}
  <div class="space-y-6 animate-in fade-in duration-300">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Semua Link Tree</h1>
        <p class="text-sm text-slate-600 mt-1">Kumpulan tautan dalam satu halaman yang mudah dibagikan.</p>
      </div>
      <button
        type="button"
        data-testid="add-link-tree-btn"
        on:click={() => (showAddModal = true)}
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-all self-start sm:self-auto"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Tambah Link Tree</span>
      </button>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {#each stats as card (card.id)}
        <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-600">{card.label}</p>
          <p data-testid={`stat-${card.id}`} class="text-3xl font-black mt-1 text-slate-900">{card.value}</p>
        </div>
      {/each}
    </div>

    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          data-testid="search-link-tree-input"
          aria-label="Cari link tree"
          bind:value={searchQuery}
          placeholder="Cari judul atau deskripsi..."
          class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
        />
      </div>

      <div class="flex items-center gap-3">
        <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            data-testid="scope-all-btn"
            on:click={() => (scope = "all")}
            class="px-3 py-1.5 rounded-lg transition-all {scope === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}"
          >
            Semua
          </button>
          <button
            type="button"
            data-testid="scope-mine-btn"
            on:click={() => (scope = "mine")}
            class="px-3 py-1.5 rounded-lg transition-all {scope === 'mine' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}"
          >
            Milik Saya
          </button>
        </div>

        {#if scope === "mine"}
          <button
            type="button"
            data-testid="delete-all-link-trees-btn"
            on:click={handleDeleteAll}
            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <Trash2 size={16} />
            Hapus Semua
          </button>
        {/if}
      </div>
    </div>

    {#if loading && filtered.length === 0}
      <div class="bg-white rounded-2xl border border-slate-200/80 px-6 py-16 text-center text-slate-600">
        <Loader2 size={36} class="mx-auto text-indigo-600 animate-spin mb-2" />
        <p class="font-medium">Memuat link tree...</p>
      </div>
    {:else if filtered.length === 0}
      <div class="bg-white rounded-2xl border border-slate-200/80 px-6 py-16 text-center text-slate-600">
        <Link2 size={40} class="mx-auto text-slate-500 mb-2" />
        <p class="font-medium">Belum ada link tree yang cocok.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {#each filtered as item (item.id)}
          <div
            data-testid={`link-tree-card-${item.id}`}
            class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden hover:shadow-lg transition-all flex flex-col"
          >
            <a
              href={`/link-trees/${item.id}`}
              data-testid={`link-tree-link-${item.id}`}
              on:click|preventDefault={() => navigate(`/link-trees/${item.id}`)}
              class="flex flex-col flex-1"
            >
              {#if item.cover}
                <img src={item.cover} alt={item.title} class="w-full h-40 object-cover bg-slate-100" />
              {:else}
                <div class="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500">
                  <ImageOff size={40} />
                </div>
              {/if}

              <div class="p-5 flex flex-col flex-1 gap-3">
                <div class="flex items-start justify-between gap-2">
                  <h2 class="font-bold text-slate-900 leading-snug line-clamp-2">{item.title}</h2>
                  <span
                    data-testid={`link-tree-type-${item.id}`}
                    class={["shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border", typeClass(item.type)]}
                  >
                    {typeLabel(item.type)}
                  </span>
                </div>
                <p class="text-sm text-slate-600 line-clamp-2">{item.description || ""}</p>
                <div class="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span class="inline-flex items-center gap-1.5"><User size={14} />{item.author?.name || "Pengguna"}</span>
                  <span class="inline-flex items-center gap-1.5"><Calendar size={14} />{formatDate(item.created_at)}</span>
                </div>
              </div>
            </a>

            <div class="px-5 pb-4 flex justify-end">
              <button
                type="button"
                data-testid={`delete-link-tree-${item.id}`}
                aria-label="Hapus link tree"
                on:click={() => handleDelete(item.id)}
                class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <AddModal show={showAddModal} onClose={() => (showAddModal = false)} />
  </div>
{/if}
