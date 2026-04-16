package com.oliwier.listmewear.api

import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/** Release build: standard OkHttp, strict certificate validation */
internal object HttpClientFactory {
    fun create(): OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()
}
