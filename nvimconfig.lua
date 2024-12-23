local toggleterm = require("toggleterm")
local cmd = vim.cmd
local set = vim.keymap.set

set("n", "<leader>td", function()
	toggleterm.exec("source ./export_env.sh && gow -e html,css,go run .", 2)
end, { noremap = true, silent = true, desc = "Start dev server" })
