package com.maquete.industrial.ferrorama

import android.bluetooth.BluetoothAdapter
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bluetooth
import androidx.compose.material.icons.filled.Train
import androidx.compose.material.icons.filled.Sensors
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Tune
import androidx.lifecycle.ViewModelProvider
import com.maquete.industrial.ferrorama.ui.screens.ConexaoScreen
import com.maquete.industrial.ferrorama.ui.screens.AgulhasScreen
import com.maquete.industrial.ferrorama.ui.screens.LocomotivasScreen
import com.maquete.industrial.ferrorama.ui.screens.SensoresScreen
import com.maquete.industrial.ferrorama.ui.theme.FerroramaTheme
import com.maquete.industrial.ferrorama.ui.viewmodel.FerroramaViewModel

/**
 * App do ferrorama (agulhas via Blutooth HC-05 + locomotivas via Wi-Fi/backend).
 *
 * Quatro abas: Conexão, Agulhas, Locomotivas e Sensores.
 */
class MainActivity : ComponentActivity() {

    private lateinit var viewModel: FerroramaViewModel

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val allGranted = results.values.all { it }
        viewModel.onPermissionsResult(allGranted)
        if (allGranted) {
            ensureBluetoothThenProceed()
        }
    }

    private val enableBtLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        viewModel.onBluetoothEnableResult(result.resultCode == RESULT_OK)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel = ViewModelProvider(
            this,
            ViewModelProvider.AndroidViewModelFactory.getInstance(application)
        )[FerroramaViewModel::class.java]

        setContent {
            FerroramaTheme {
                val snackbarHostState = remember { SnackbarHostState() }
                val btError = viewModel.btError
                val serverError = viewModel.serverError

                LaunchedEffect(btError) {
                    if (btError != null) {
                        snackbarHostState.showSnackbar(btError)
                        viewModel.clearErrors()
                    }
                }
                LaunchedEffect(serverError) {
                    if (serverError != null) {
                        snackbarHostState.showSnackbar(serverError)
                        viewModel.clearErrors()
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        MainScaffold(
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

    private fun requestBluetoothPermissions() {
        permissionLauncher.launch(viewModel.permissionsToRequest())
    }

    private fun ensureBluetoothThenProceed() {
        if (viewModel.shouldRequestBluetoothEnable()) {
            @Suppress("DEPRECATION")
            val enableBtIntent = Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE)
            enableBtLauncher.launch(enableBtIntent)
        }
    }
}

private data class TabItem(
    val label: String,
    val icon: ImageVector
)

@Composable
private fun MainScaffold(
    viewModel: FerroramaViewModel,
    onRequestBluetoothPermissions: () -> Unit,
    onEnableBluetooth: () -> Unit
) {
    var selectedIndex by remember { mutableIntStateOf(0) }

    val tabs = listOf(
        TabItem("Conexão", Icons.Default.Settings),
        TabItem("Agulhas", Icons.Default.Tune),
        TabItem("Locomotivas", Icons.Default.Train),
        TabItem("Sensores", Icons.Default.Sensors)
    )

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                tabs.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        selected = selectedIndex == index,
                        onClick = { selectedIndex = index },
                        icon = { Icon(tab.icon, contentDescription = tab.label) },
                        label = { Text(tab.label) }
                    )
                }
            }
        }
    ) { innerPadding ->
        val modifier = Modifier
            .fillMaxSize()
            .padding(innerPadding)

        when (selectedIndex) {
            0 -> ConexaoScreen(
                viewModel = viewModel,
                modifier = modifier,
                onRequestBluetoothPermissions = onRequestBluetoothPermissions,
                onEnableBluetooth = onEnableBluetooth
            )
            1 -> AgulhasScreen(viewModel = viewModel, modifier = modifier)
            2 -> LocomotivasScreen(viewModel = viewModel, modifier = modifier)
            3 -> SensoresScreen(viewModel = viewModel, modifier = modifier)
        }
    }
}