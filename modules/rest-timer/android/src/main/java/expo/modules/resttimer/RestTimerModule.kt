package expo.modules.resttimer

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

/** Textos da notificacao, montados no JS (pt-BR). */
class RestTexts : Record {
  @Field var title: String = "Descanso"
  @Field var body: String = "Meu Plano"
  @Field var doneTitle: String = "Descanso terminado"
  @Field var doneBody: String = "Hora da próxima série"
}

/**
 * Superficie JS do modulo nativo "RestTimer" (so Android).
 * Consumido apenas por src/services/restNotification.ts.
 */
class RestTimerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("RestTimer")

    // Mostra a contagem regressiva e agenda o aviso do fim para endsAtMs (epoch ms).
    // Devolve true se o aviso do fim ficou com alarme EXATO e a notificacao pode aparecer.
    Function("start") { endsAtMs: Double, texts: RestTexts ->
      RestTimerNotifier.start(
        context, endsAtMs.toLong(), texts.title, texts.body, texts.doneTitle, texts.doneBody
      )
    }

    Function("cancel") {
      RestTimerNotifier.cancel(context)
    }

    Function("areNotificationsEnabled") {
      RestTimerNotifier.areNotificationsEnabled(context)
    }

    // Canal "Fim do descanso" ligado e com som (Android 8+; antes disso, true).
    Function("isDoneChannelEnabled") {
      RestTimerNotifier.isDoneChannelEnabled(context)
    }

    Function("canScheduleExactAlarms") {
      RestTimerNotifier.canScheduleExactAlarms(context)
    }

    // Tela "Alarmes e lembretes" do Android 12+ para este app.
    Function("openExactAlarmSettings") {
      val ctx = context
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${ctx.packageName}"))
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}"))
      }
      openSettings(ctx, intent)
    }

    // Ajustes de notificacao do app (para reativar depois de negar).
    Function("openAppNotificationSettings") {
      val ctx = context
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
          .putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName)
      } else {
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}"))
      }
      openSettings(ctx, intent)
    }
  }

  private fun openSettings(ctx: Context, intent: Intent) {
    val activity = appContext.currentActivity
    try {
      if (activity != null) {
        activity.startActivity(intent)
      } else {
        ctx.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
    } catch (_: Exception) {
      // Fallback: detalhes do app.
      val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${ctx.packageName}"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      try { ctx.startActivity(fallback) } catch (_: Exception) {}
    }
  }
}
