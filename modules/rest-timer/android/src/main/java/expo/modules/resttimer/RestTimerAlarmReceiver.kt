package expo.modules.resttimer

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Disparado pelo AlarmManager no horario de termino do descanso, mesmo com o
 * app em segundo plano, a tela bloqueada ou o processo encerrado.
 */
class RestTimerAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val endsAt = intent.getLongExtra(RestTimerNotifier.EXTRA_ENDS_AT, -1L)
    if (endsAt <= 0L) return
    val title = intent.getStringExtra(RestTimerNotifier.EXTRA_TITLE) ?: "Descanso terminado"
    val body = intent.getStringExtra(RestTimerNotifier.EXTRA_BODY) ?: "Hora da próxima série"
    // showDone cancela a contagem (RUNNING_ID) antes de publicar o aviso (DONE_ID).
    RestTimerNotifier.showDone(context, endsAt, title, body)
  }
}
