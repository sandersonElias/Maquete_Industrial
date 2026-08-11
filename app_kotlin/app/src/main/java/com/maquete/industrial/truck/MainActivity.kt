package com.maquete.industrial.truck

import android.bluetooth.BluetoothAdapter
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModelProvider
import com.maquete.industrial.truck.ui.screens.ControlScreen
import com.maquete.industrial.truck.ui.theme.MaqueteTruckTheme
import com.maquete.industrial.truck.ui.viewmodel.TruckViewModel

/**
 * App de uma tela só — painel de controle do caminhão basculante.
 *
 * Não há mais navegação inferior nem Dashboard/Histórico/Settings.
 * A MainActivity abre direto a ControlScreen, dentro do tema + Scaffold
 * mínimo (apenas SnackbarHost para mensagens de erro).
 */
class MainActivity : ComponentActivity() {

    private lateinit var viewModel: TruckViewModel

    /**
     * Launcher moderno para pedir múltiplas permissões runtime (BLUETOOTH_CONNECT
     * + BLUETOOTH_SCAN no API 31+, BLUETOOTH/ADMIN/FINE_LOC no pre-31).
     * Substitui `requestPermissions(permissions, 1001)` legado.
     */
    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val allGranted = results.values.all { it }
        viewModel.onPermissionsResult(allGranted)
        if (allGranted) {
            ensureBluetoothThenProceed()
        }
    }

    /**
     * Launcher para `ACTION_REQUEST_ENABLE` (pedir para ligar o BT).
     * Substitui `startActivityForResult(Intent, 1002)`.
     */
    private val enableBtLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val enabled = result.resultCode == RESULT_OK
        viewModel.onBluetoothEnableResult(enabled)
        if (!enabled) {
            Toast.makeText(this, "Bluetooth desligado", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // VM instance created here (not inside setContent) so the launchers above
        // have a `viewModel` to deliver results to.
        viewModel = ViewModelProvider(
            this,
            ViewModelProvider.AndroidViewModelFactory.getInstance(application)
        )[TruckViewModel::class.java]

        setContent {
            MaqueteTruckTheme {
                val snackbarHostState = remember { SnackbarHostState() }
                val errorMessage = viewModel.errorMessage
                LaunchedEffect(errorMessage) {
                    if (errorMessage != null) {
                        snackbarHostState.showSnackbar(errorMessage)
                        viewModel.clearError()
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        ControlScreen(
                            viewModel = viewModel,
                            onRequestBluetoothPermissions = { requestBluetoothPermissions() },
                            onEnableBluetooth = { ensureBluetoothThenProceed() }
                        )
                        SnackbarHost(
                            hostState = snackbarHostState,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }
            }
        }
    }

    /**
     * Pede permissões Bluetooth via launcher moderno, ramificando por API,
     * delegando ao VM a construção do array.
     */
    private fun requestBluetoothPermissions() {
        permissionLauncher.launch(viewModel.permissionsToRequest())
    }

    /**
     * Verifica se o BT está habilitado; se não, dispara o launcher para pedir
     * ACTION_REQUEST_ENABLE. Se já está ON, não faz nada (o usuário continuará
     * o fluxo manualmente a partir da ControlScreen).
     */
    private fun ensureBluetoothThenProceed() {
        if (viewModel.shouldRequestBluetoothEnable()) {
            @Suppress("DEPRECATION")
            val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
            enableBtLauncher.launch(enableBtIntent)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        // Com `configChanges` no manifest, isto só dispara quando o usuário
        // realmente sai — rotações não recriam a Activity.
        com.maquete.industrial.truck.bluetooth.TruckBluetoothService.shutdown()
    }
}
