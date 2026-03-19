$file = "js\ejercicios.js"
$content = [System.IO.File]::ReadAllText($file)
if ($content.Contains("`r`n")) { $nl = "`r`n" } else { $nl = "`n" }

$content = $content.Replace("if (!confirm('¿Limpiar la pizarra y empezar desde cero?')) return;", "ejConfirm('¿Limpiar la pizarra y empezar desde cero?', () => {")
$content = $content.Replace("    ejRenderToolbar();" + $nl + "}" + $nl + "function ejClearAll()", "    ejRenderToolbar();" + $nl + "    });" + $nl + "}" + $nl + "function ejClearAll()")

$content = $content.Replace("if (!confirm('¿Borrar toda la pizarra?')) return;", "ejConfirm('¿Borrar toda la pizarra?', () => {")
$content = $content.Replace("    ejRenderToolbar();" + $nl + "}" + $nl + "function ejSetTool(", "    ejRenderToolbar();" + $nl + "    });" + $nl + "}" + $nl + "function ejSetTool(")

$old3 = "if (!confirm('¿Eliminar " + [char]34 + "' + (e ? e.name : '') + '" + [char]34 + "? No se puede deshacer.')) return;"
$new3 = "ejConfirm('¿Eliminar " + [char]34 + "' + (e ? e.name : '') + '" + [char]34 + "? No se puede deshacer.', async () => {"
$content = $content.Replace($old3, $new3)
$content = $content.Replace("        ejBancoSearch();" + $nl + "    } catch(err) {" + $nl + "        ejToast('Error: ' + err.message, 'error');" + $nl + "    }" + $nl + "}" + $nl + "async function ejEliminarEjercicio()", "        ejBancoSearch();" + $nl + "    } catch(err) {" + $nl + "        ejToast('Error: ' + err.message, 'error');" + $nl + "    }" + $nl + "    });" + $nl + "}" + $nl + "async function ejEliminarEjercicio()")

$content = $content.Replace("        if (!confirm('¿Eliminar este ejercicio? Esta acción no se puede deshacer.')) return;", "        ejConfirm('¿Eliminar este ejercicio? Esta acción no se puede deshacer.', async () => {")
$content = $content.Replace("    if (!confirm('¿Eliminar este ejercicio? Esta acción no se puede deshacer.')) return;", "    ejConfirm('¿Eliminar este ejercicio? Esta acción no se puede deshacer.', async () => {")
$content = $content.Replace("        ejToast('Error al eliminar: ' + err.message, 'error');" + $nl + "    }" + $nl + "}" + $nl + "function ejCalcEII()", "        ejToast('Error al eliminar: ' + err.message, 'error');" + $nl + "    }" + $nl + "    });" + $nl + "}" + $nl + "function ejCalcEII()")
$content = $content.Replace("            ejBancoRender(ejBancoCache);" + $nl + "        } catch(err) {" + $nl + "            ejToast('Error al eliminar: ' + err.message, 'error');" + $nl + "        }" + $nl + "    });", "            ejBancoRender(ejBancoCache);" + $nl + "            } catch(err) {" + $nl + "                ejToast('Error al eliminar: ' + err.message, 'error');" + $nl + "            }" + $nl + "        });" + $nl + "    });")

$content = $content.Replace("if (!confirm('¿Eliminar el último frame?')) return;", "ejConfirm('¿Eliminar el último frame?', () => {")
$content = $content.Replace("    ejRenderTimeline();" + $nl + "}" + $nl + "function ejFrameUndoTraj()", "    ejRenderTimeline();" + $nl + "    });" + $nl + "}" + $nl + "function ejFrameUndoTraj()")

[System.IO.File]::WriteAllText($file, $content)
Write-Host "Listo"