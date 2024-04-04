local function sveltekit()
	vim.cmd [[ Lazy load toggleterm.nvim ]]
	vim.cmd [[ 1ToggleTerm ]]
	vim.cmd [[ 2TermExec cmd="pnpm dev" ]]
end

vim.keymap.set('n', '<leader>td', sveltekit, {
	noremap = true,
	silent = true,
	desc = 'Open SvelteKit dev server windows',
})
