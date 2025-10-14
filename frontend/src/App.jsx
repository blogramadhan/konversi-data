import { useState } from 'react'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  useToast,
  Card,
  CardBody,
  Icon,
  Progress,
  Badge,
  HStack,
} from '@chakra-ui/react'
import { FiFile, FiDownload } from 'react-icons/fi'
import axios from 'axios'

const API_URL = 'http://localhost:8000'

function App() {
  const [file, setFile] = useState(null)
  const [sheetName, setSheetName] = useState('Data')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop().toLowerCase()
      if (!['json', 'csv'].includes(fileExt)) {
        toast({
          title: 'Format file tidak valid',
          description: 'Gunakan file .json atau .csv',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      toast({
        title: 'Pilih file',
        description: 'Silakan pilih file JSON atau CSV terlebih dahulu',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('sheet_name', sheetName)

    try {
      const response = await axios.post(`${API_URL}/convert`, formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${file.name.split('.')[0]}_converted.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast({
        title: 'Konversi berhasil!',
        description: 'File Excel telah berhasil diunduh',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Reset form
      setFile(null)
      event.target.reset()
    } catch (error) {
      console.error('Error:', error)
      console.error('Error response:', error.response)

      let errorMessage = 'Terjadi kesalahan saat konversi'

      if (error.response) {
        // Server responded with error
        if (error.response.data instanceof Blob) {
          // Error response is Blob, need to read it
          try {
            const text = await error.response.data.text()
            const errorData = JSON.parse(text)
            errorMessage = errorData.detail || errorMessage
          } catch (e) {
            console.error('Failed to parse error blob:', e)
          }
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        }

        errorMessage += ` (Status: ${error.response.status})`
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan di http://localhost:8000'
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage
      }

      toast({
        title: 'Konversi gagal',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setSheetName('Data')
  }

  return (
    <Box minH="100vh" bg="gray.50" py={10}>
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={2}>
            <Heading size="xl" color="blue.600">
              Konversi Data ke Excel
            </Heading>
            <Text color="gray.600" textAlign="center">
              Konversi file JSON atau CSV ke format Excel (.xlsx) dengan mudah
            </Text>
          </VStack>

          {/* Main Card */}
          <Card>
            <CardBody>
              <form onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch">
                  {/* File Upload */}
                  <FormControl isRequired>
                    <FormLabel>Upload File</FormLabel>
                    <Input
                      type="file"
                      accept=".json,.csv"
                      onChange={handleFileChange}
                      p={1}
                      disabled={loading}
                    />
                    <FormHelperText>
                      Format yang didukung: .json dan .csv
                    </FormHelperText>
                  </FormControl>

                  {/* Selected File Info */}
                  {file && (
                    <HStack
                      p={4}
                      bg="blue.50"
                      borderRadius="md"
                      borderWidth={1}
                      borderColor="blue.200"
                    >
                      <Icon as={FiFile} color="blue.500" boxSize={5} />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontWeight="medium">{file.name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {(file.size / 1024).toFixed(2)} KB
                        </Text>
                      </VStack>
                      <Badge colorScheme="blue">
                        {file.name.split('.').pop().toUpperCase()}
                      </Badge>
                    </HStack>
                  )}

                  {/* Sheet Name */}
                  <FormControl>
                    <FormLabel>Nama Sheet Excel</FormLabel>
                    <Input
                      value={sheetName}
                      onChange={(e) => setSheetName(e.target.value)}
                      placeholder="Data"
                      disabled={loading}
                    />
                    <FormHelperText>
                      Nama sheet yang akan dibuat di file Excel
                    </FormHelperText>
                  </FormControl>

                  {/* Progress */}
                  {loading && (
                    <Box>
                      <Text mb={2} fontSize="sm" color="gray.600">
                        Sedang memproses...
                      </Text>
                      <Progress size="sm" isIndeterminate colorScheme="blue" />
                    </Box>
                  )}

                  {/* Buttons */}
                  <HStack spacing={4}>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      leftIcon={<Icon as={FiDownload} />}
                      isLoading={loading}
                      loadingText="Konversi..."
                      flex={1}
                    >
                      Konversi ke Excel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </CardBody>
          </Card>

          {/* Info */}
          <Card bg="blue.50" borderColor="blue.200">
            <CardBody>
              <VStack align="start" spacing={2}>
                <Heading size="sm" color="blue.700">
                  Cara Penggunaan:
                </Heading>
                <Text fontSize="sm" color="gray.700">
                  1. Pilih file JSON atau CSV yang ingin dikonversi
                </Text>
                <Text fontSize="sm" color="gray.700">
                  2. Atur nama sheet (opsional)
                </Text>
                <Text fontSize="sm" color="gray.700">
                  3. Klik "Konversi ke Excel" untuk memulai konversi
                </Text>
                <Text fontSize="sm" color="gray.700">
                  4. File Excel akan otomatis terunduh setelah konversi selesai
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  )
}

export default App
