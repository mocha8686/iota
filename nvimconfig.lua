local function devServer()
	local toggleterm = require("toggleterm")
	toggleterm.exec("source ./export_env.sh && gow -e html,css,js,go run .", 2)
	toggleterm.toggle(2)
	toggleterm.toggle(1)
end

vim.keymap.set("n", "<leader>td", devServer, { noremap = true, silent = true, desc = "Start dev server" })
